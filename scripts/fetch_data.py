import json
import os
import time
from datetime import datetime
from SPARQLWrapper import SPARQLWrapper, JSON

def fetch_wikidata():
    endpoint_url = "https://query.wikidata.org/sparql"
    
    # Optimized Query: Higher threshold (>200) to reduce server load significantly
    query = """
    SELECT ?human ?humanLabel ?birthDate ?deathDate ?image WHERE {
      {
        SELECT ?human WHERE {
          ?human wdt:P31 wd:Q5.           # Instance of Human
          ?human wikibase:sitelinks ?sitelinks.
          FILTER(?sitelinks > 200)        # Increased threshold from 150 to 200
        }
        ORDER BY DESC(?sitelinks)
        LIMIT 1000                        # Fetch top 1000
      }
      OPTIONAL { ?human wdt:P569 ?birthDate. }
      OPTIONAL { ?human wdt:P570 ?deathDate. }
      OPTIONAL { ?human wdt:P18 ?image. }
      SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
    }
    """

    user_agent = "DeadOrAliveApp/1.0 (https://github.com/shijie/ikide; contact: shijie)"
    sparql = SPARQLWrapper(endpoint_url)
    sparql.addCustomHttpHeader("User-Agent", user_agent)
    sparql.setQuery(query)
    sparql.setReturnFormat(JSON)
    sparql.setTimeout(120) # Increase timeout to 120 seconds

    max_retries = 3
    retry_delay = 5 # seconds

    for attempt in range(1, max_retries + 1):
        try:
            print(f"Attempt {attempt}: Fetching data from Wikidata...")
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
            return # Success, exit function
            
        except Exception as e:
            print(f"Error on attempt {attempt}: {e}")
            if attempt < max_retries:
                print(f"Waiting {retry_delay} seconds before next attempt...")
                time.sleep(retry_delay)
            else:
                print("Max retries reached. Failing.")
                exit(1)

if __name__ == "__main__":
    fetch_wikidata()
