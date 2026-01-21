import json
import os
import time
import requests
from PIL import Image
import io
from SPARQLWrapper import SPARQLWrapper, JSON

def fetch_data_from_wikidata():
    endpoint_url = "https://query.wikidata.org/sparql"
    sparql = SPARQLWrapper(endpoint_url)
    sparql.addCustomHttpHeader("User-Agent", "DeadOrAliveApp/1.0 (contact: your-github-username)")
    sparql.setReturnFormat(JSON)
    sparql.setTimeout(60)

    # Setup directories
    IMAGES_DIR = "data/images"
    os.makedirs(IMAGES_DIR, exist_ok=True)
    
    CDN_BASE_URL = "https://cdn.jsdelivr.net/gh/bing104917-collab/dead-or-alive-data@main/data/images/"

    # Dictionary to store unique celebrities
    celebrities = {}

    def process_image(wd_id, image_url):
        if not image_url:
            return ""
            
        file_path = os.path.join(IMAGES_DIR, f"{wd_id}.jpg")
        
        # Skip if already exists
        if os.path.exists(file_path):
            return f"{CDN_BASE_URL}{wd_id}.jpg"
            
        try:
            print(f"  > Downloading image for {wd_id}...")
            # Define headers to mimic a browser and comply with Wikimedia policy 
            headers = { 
                "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 DeadOrAliveApp/1.0" 
            } 
            response = requests.get(image_url, headers=headers, timeout=15)
            if response.status_code == 200:
                img_data = response.content
                img = Image.open(io.BytesIO(img_data))
                
                # Convert to RGB if necessary (e.g. for RGBA or CMYK)
                if img.mode != 'RGB':
                    img = img.convert('RGB')
                
                # Resize: max width 400px, keep aspect ratio
                max_width = 400
                if img.width > max_width:
                    ratio = max_width / float(img.width)
                    new_height = int(float(img.height) * ratio)
                    img = img.resize((max_width, new_height), Image.Resampling.LANCZOS)
                
                # Save as JPEG
                img.save(file_path, "JPEG", quality=85)
                
                # Small delay to be polite
                time.sleep(0.5)
                return f"{CDN_BASE_URL}{wd_id}.jpg"
            else:
                print(f"  > Failed to download image for {wd_id}: Status {response.status_code}")
                return image_url # Fallback to original
        except Exception as e:
            print(f"  > Error processing image for {wd_id}: {e}")
            return image_url # Fallback to original

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

                    # Process and mirror image
                    cdn_image_url = process_image(wd_id, image)

                    entry = {
                        "id": wd_id,
                        "n": name,
                        "s": status
                    }
                    if birth: entry["b"] = birth
                    if death: entry["d"] = death
                    if cdn_image_url: entry["i"] = cdn_image_url
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
