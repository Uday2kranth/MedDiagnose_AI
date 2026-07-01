import requests

# ===== Test 1: breast_cancer.csv =====
print("=" * 60)
print("TEST 1: breast_cancer.csv")
print("=" * 60)
try:
    with open("breast_cancer.csv", "rb") as f:
        r = requests.post("http://127.0.0.1:8000/api/columns", files={"file": f})
    print(f"Status: {r.status_code}")
    data = r.json()
    cols = data["columns"]
    print(f"Columns ({len(cols)}): {cols}")
    print(f"Rows: {data['rows']}")

    # Now train with default last column
    target = cols[-1]
    print(f"Training with target: {target}")
    r2 = requests.post("http://127.0.0.1:8000/api/upload", data={"target_col": target})
    print(f"Train status: {r2.status_code}")
    if r2.status_code == 200:
        train_data = r2.json()
        print(f"Task type: {train_data['task_type']}")
        print(f"Metrics: {train_data['metrics']}")
    else:
        print(f"ERROR: {r2.text}")
except Exception as e:
    print(f"EXCEPTION: {e}")
    import traceback; traceback.print_exc()

print()

# ===== Test 2: Boston Housing CSV =====
print("=" * 60)
print("TEST 2: boston_housing_test.csv (Regression)")
print("=" * 60)
try:
    with open("boston_housing_test.csv", "rb") as f:
        r = requests.post("http://127.0.0.1:8000/api/columns", files={"file": f})
    print(f"Status: {r.status_code}")
    data = r.json()
    cols = data["columns"]
    print(f"Columns ({len(cols)}): {cols}")
    print(f"Rows: {data['rows']}")

    target = "PRICE"
    print(f"Training with target: {target}")
    r2 = requests.post("http://127.0.0.1:8000/api/upload", data={"target_col": target})
    print(f"Train status: {r2.status_code}")
    if r2.status_code == 200:
        train_data = r2.json()
        print(f"Task type: {train_data['task_type']}")
        print(f"Metrics: {train_data['metrics']}")
    else:
        print(f"ERROR: {r2.text}")
except Exception as e:
    print(f"EXCEPTION: {e}")
    import traceback; traceback.print_exc()

print()

# ===== Test 3: Predict with Boston Housing =====
print("=" * 60)
print("TEST 3: Predict on Boston Housing")
print("=" * 60)
try:
    # Get a sample
    r = requests.get("http://127.0.0.1:8000/api/sample")
    if r.status_code == 200:
        sample = r.json()["sample"]
        print(f"Sample data: {sample}")
        
        # Run prediction
        rp = requests.post("http://127.0.0.1:8000/api/predict", json=sample)
        print(f"Predict status: {rp.status_code}")
        if rp.status_code == 200:
            pred = rp.json()
            print(f"Task type: {pred['task_type']}")
            print(f"Prediction: {pred['prediction']}")
        else:
            print(f"ERROR: {rp.text}")
    else:
        print(f"Sample error: {r.text}")
except Exception as e:
    print(f"EXCEPTION: {e}")
    import traceback; traceback.print_exc()
