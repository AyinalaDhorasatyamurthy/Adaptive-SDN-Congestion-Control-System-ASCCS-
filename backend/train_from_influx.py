import pandas as pd
from influxdb_client import InfluxDBClient
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score
import joblib
import os
from dotenv import load_dotenv
import numpy as np

# Load environment variables from .env
load_dotenv()

# InfluxDB configuration
INFLUX_URL = f"http://{os.getenv('INFLUX_HOST', 'localhost')}:{os.getenv('INFLUX_PORT', '8086')}"
INFLUX_TOKEN = os.getenv("INFLUX_TOKEN")
INFLUX_ORG = os.getenv("INFLUX_ORG")
INFLUX_BUCKET = os.getenv("INFLUX_DB")

# Connect to InfluxDB
client = InfluxDBClient(url=INFLUX_URL, token=INFLUX_TOKEN, org=INFLUX_ORG)
query_api = client.query_api()

# Flux query to get queue_stats from the last 7 days
flux = f'''
from(bucket: "{INFLUX_BUCKET}")
|> range(start: -7d)
|> filter(fn: (r) => r._measurement == "queue_stats")
|> pivot(rowKey:["_time"], columnKey: ["_field"], valueColumn: "_value")
|> keep(columns: ["_time", "backlog", "drops", "overlimits", "congestion"])
'''

# Run the query
print("📡 Querying InfluxDB...")
df = query_api.query_data_frame(flux)

# If it's a single DataFrame, avoid using concat
if isinstance(df, list):
    df = pd.concat(df, ignore_index=True)

# Drop rows with missing values
df = df.dropna()

# Print column names for debugging
print("📋 Columns found in data:", df.columns.tolist())

# If 'congestion' column is missing, simulate it with more balanced thresholds
if "congestion" not in df.columns:
    print("⚠️ 'congestion' column missing — simulating using rule-based logic")
    # More balanced congestion detection rules
    df["congestion"] = np.where(
        (
            (df["backlog"] > 10000) |  # Higher backlog threshold
            (df["drops"] > 20) |        # Higher drops threshold
            (df["overlimits"] > 100)     # Added overlimits threshold
        ),
        1,
        0
    )

# Check for required fields
required = ["backlog", "drops", "overlimits", "congestion"]
if not set(required).issubset(df.columns):
    raise ValueError("❌ Missing one or more required fields in InfluxDB data.")

# Print class distribution
print("📊 Class distribution:")
print(df["congestion"].value_counts())

# Prepare training data
X = df[required[:-1]]
y = df["congestion"]

# Split data
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Train RandomForest model
print("🧠 Training RandomForest model...")
model = RandomForestClassifier(n_estimators=100, random_state=42)
model.fit(X_train, y_train)

# Evaluate model
y_pred = model.predict(X_test)
accuracy = accuracy_score(y_test, y_pred)
print(f"✅ Model accuracy: {accuracy:.4f}")

# Save model
joblib.dump(model, "model.pkl")
print("📦 Model saved to model.pkl")
