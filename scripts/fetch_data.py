import json
import os
from datetime import datetime
from SPARQLWrapper import SPARQLWrapper, JSON

def fetch_wikidata():
    endpoint_url = "https://query.wikidata.org/sparql"
    
    # Query for top 2000 humans by sitelinks (popularity)
    query = """
    SELECT ?human ?humanLabel ?birthDate ?deathDate ?image ?description WHERE {
      ?human wdt:P31 wd:Q5.
      ?human wikibase:sitelinks ?sitelinks.
      FILTER(?sitelinks > 50)
      
      OPTIONAL { ?human wdt:P569 ?birthDate. }
      OPTIONAL { ?human wdt:P570 ?deathDate. }
      OPTIONAL { ?human wdt:P18 ?image. }
      
      SERVICE wikibase:label { 
        bd:serviceParam wikibase:language "en". 
      }
    }
    ORDER BY DESC(?sitelinks)
    LIMIT 2000
    """

    user_agent = "ikide-bot/1.0 (https://github.com/shijie/ikide)"
    sparql = SPARQLWrapper(endpoint_url, agent=user_agent)
    sparql.setQuery(query)
    sparql.setReturnFormat(JSON)
    
    try:
        results = sparql.query().convert()
        celebrities = []
        
        for result in results["results"]["bindings"]:
            # Extract ID from URI
            wd_id = result["human"]["value"].split('/')[-1]
            
            name = result.get("humanLabel", {}).get("value", "Unknown")
            birth = result.get("birthDate", {}).get("value", "")
            death = result.get("deathDate", {}).get("value", "")
            image = result.get("image", {}).get("value", "")
            description = result.get("description", {}).get("value", "")
            
            # Format dates (YYYY-MM-DD)
            if birth: birth = birth.split('T')[0]
            if death: death = death.split('T')[0]
            
            status = 'd' if death else 'a'
            
            # Minimize JSON size
            entry = {
                "id": wd_id,
                "n": name,
                "s": status
            }
            
            if birth: entry["b"] = birth
            if death: entry["d"] = death
            if image: entry["i"] = image
            if description: entry["o"] = description
            
            celebrities.append(entry)
            
        # Ensure data directory exists
        os.makedirs("data", exist_ok=True)
        
        with open("data/celebrities.json", "w", encoding="utf-8") as f:
            json.dump(celebrities, f, separators=(',', ':'), ensure_ascii=False)
            
        print(f"Successfully fetched {len(celebrities)} celebrities.")
        
    except Exception as e:
        print(f"Error fetching data: {e}")
        exit(1)

if __name__ == "__main__":
    fetch_wikidata()
