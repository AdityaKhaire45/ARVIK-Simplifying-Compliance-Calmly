import requests, json

r = requests.get("https://generativelanguage.googleapis.com/v1beta/models?key=AIzaSyC8eWa3zYWbgNNLwVRmXE2wyg6JDY0b5hw")
models = json.loads(r.text)["models"]

with open("models_list.txt", "w") as f:
    for m in models:
        f.write(f"{m['name']}  |  {m.get('displayName','')}\n")

print(f"Total models: {len(models)}")
print("Saved to models_list.txt")
