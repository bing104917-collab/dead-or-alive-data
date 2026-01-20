import json
import os
import time
from SPARQLWrapper import SPARQLWrapper, JSON

def fetch_data_from_wikidata():
    endpoint_url = "https://query.wikidata.org/sparql"
    sparql = SPARQLWrapper(endpoint_url)
    sparql.addCustomHttpHeader("User-Agent", "DeadOrAliveApp/1.0 (contact: your-github-username)")
    sparql.setReturnFormat(JSON)
    sparql.setTimeout(60)

    # Dictionary to store unique celebrities
    celebrities = {}

    def run_query(label, sparql_query):
        try:
            print(f"Fetching: {label}...")
            sparql.setQuery(sparql_query)
            results = sparql.query().convert()
            
            count = 0
            for result in results["results"]["bindings"]:
                try:
                    wd_id = result["human"]["value"].split('/')[-1]
                    
                    if wd_id in celebrities:
                        continue

                    name = result.get("humanLabel", {}).get("value", "Unknown")
                    desc = result.get("description", {}).get("value", "")
                    birth = result.get("birthDate", {}).get("value", "")
                    death = result.get("deathDate", {}).get("value", "")
                    image = result.get("image", {}).get("value", "")

                    if birth: birth = birth.split('T')[0]
                    if death: death = death.split('T')[0]
                    
                    status = 'd' if death else 'a'

                    entry = {
                        "id": wd_id,
                        "n": name,
                        "s": status
                    }
                    if birth: entry["b"] = birth
                    if death: entry["d"] = death
                    if image: entry["i"] = image
                    if desc: entry["o"] = desc
                    
                    celebrities[wd_id] = entry
                    count += 1
                except:
                    continue
            print(f"  > Success! Added {count} new entries.")
            time.sleep(1) 
        except Exception as e:
            print(f"  > Failed to fetch {label}: {e}")

    # 1. Recent Deaths (Keep as is, working well)
    query_dead = """
    SELECT ?human ?humanLabel ?birthDate ?deathDate ?image ?description WHERE {
        ?human wdt:P31 wd:Q5; wdt:P570 ?deathDate; wikibase:sitelinks ?sitelinks.
        FILTER(?deathDate >= "2021-01-01"^^xsd:dateTime)
        FILTER(?sitelinks > 20)
        OPTIONAL { ?human wdt:P569 ?birthDate. }
        OPTIONAL { ?human wdt:P18 ?image. }
        OPTIONAL { ?human schema:description ?description FILTER(LANG(?description) = "en"). }
        SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
    } ORDER BY DESC(?sitelinks) LIMIT 250
    """
    run_query("Recent Deaths", query_dead)

    # 2. Top Actors (Lowered threshold 200 -> 80)
    query_actors = """
    SELECT ?human ?humanLabel ?birthDate ?deathDate ?image ?description WHERE {
        ?human wdt:P31 wd:Q5; wdt:P106 wd:Q33999; wikibase:sitelinks ?sitelinks.
        FILTER(?sitelinks > 80)
        OPTIONAL { ?human wdt:P569 ?birthDate. }
        OPTIONAL { ?human wdt:P570 ?deathDate. }
        OPTIONAL { ?human wdt:P18 ?image. }
        OPTIONAL { ?human schema:description ?description FILTER(LANG(?description) = "en"). }
        SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
    } ORDER BY DESC(?sitelinks) LIMIT 200
    """
    run_query("Top Actors", query_actors)

    # 3. Top Musicians (Lowered threshold 200 -> 80)
    query_music = """
    SELECT ?human ?humanLabel ?birthDate ?deathDate ?image ?description WHERE {
        ?human wdt:P31 wd:Q5; wdt:P106 wd:Q639669; wikibase:sitelinks ?sitelinks.
        FILTER(?sitelinks > 80)
        OPTIONAL { ?human wdt:P569 ?birthDate. }
        OPTIONAL { ?human wdt:P570 ?deathDate. }
        OPTIONAL { ?human wdt:P18 ?image. }
        OPTIONAL { ?human schema:description ?description FILTER(LANG(?description) = "en"). }
        SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
    } ORDER BY DESC(?sitelinks) LIMIT 200
    """
    run_query("Top Musicians", query_music)

    # 4. Top Politicians (Lowered threshold 200 -> 80)
    query_poli = """
    SELECT ?human ?humanLabel ?birthDate ?deathDate ?image ?description WHERE {
        ?human wdt:P31 wd:Q5; wdt:P106 wd:Q82955; wikibase:sitelinks ?sitelinks.
        FILTER(?sitelinks > 80)
        OPTIONAL { ?human wdt:P569 ?birthDate. }
        OPTIONAL { ?human wdt:P570 ?deathDate. }
        OPTIONAL { ?human wdt:P18 ?image. }
        OPTIONAL { ?human schema:description ?description FILTER(LANG(?description) = "en"). }
        SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
    } ORDER BY DESC(?sitelinks) LIMIT 150
    """
    run_query("Top Politicians", query_poli)

    # 5. NEW: Top Athletes (Soccer, Basketball, Tennis, etc.)
    # Uses generic "sportsperson" Q2066131
    query_sports = """
    SELECT ?human ?humanLabel ?birthDate ?deathDate ?image ?description WHERE {
        ?human wdt:P31 wd:Q5; wdt:P106 wd:Q2066131; wikibase:sitelinks ?sitelinks.
        FILTER(?sitelinks > 80)
        OPTIONAL { ?human wdt:P569 ?birthDate. }
        OPTIONAL { ?human wdt:P570 ?deathDate. }
        OPTIONAL { ?human wdt:P18 ?image. }
        OPTIONAL { ?human schema:description ?description FILTER(LANG(?description) = "en"). }
        SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
    } ORDER BY DESC(?sitelinks) LIMIT 150
    """
    run_query("Top Athletes", query_sports)

    # 6. Top Businesspeople (Lowered threshold 100 -> 40)
    query_biz = """
    SELECT ?human ?humanLabel ?birthDate ?deathDate ?image ?description WHERE {
        ?human wdt:P31 wd:Q5; wdt:P106 wd:Q8065; wikibase:sitelinks ?sitelinks.
        FILTER(?sitelinks > 40)
        OPTIONAL { ?human wdt:P569 ?birthDate. }
        OPTIONAL { ?human wdt:P570 ?deathDate. }
        OPTIONAL { ?human wdt:P18 ?image. }
        OPTIONAL { ?human schema:description ?description FILTER(LANG(?description) = "en"). }
        SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
    } ORDER BY DESC(?sitelinks) LIMIT 100
    """
    run_query("Top Businesspeople", query_biz)

    # Save
    final_list = list(celebrities.values())
    final_list.sort(key=lambda x: x['n']) 

    os.makedirs("data", exist_ok=True)
    with open("data/celebrities.json", "w", encoding="utf-8") as f:
        json.dump(final_list, f, separators=(',', ':'), ensure_ascii=False)
    
    print(f"✅ DONE! Total unique celebrities fetched: {len(final_list)}")

if __name__ == "__main__":
    fetch_data_from_wikidata()