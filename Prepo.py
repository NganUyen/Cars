import pandas as pd
import numpy as np
import pymongo
from datetime import datetime
from sklearn.preprocessing import OneHotEncoder
from filters_car_price import run_filters, default_config
import os

# ==============================
# 1️⃣  Đọc dữ liệu từ MongoDB hoặc CSV
# ==============================
def load_data(from_mongo=True, mongo_uri="mongodb://localhost:27017/"):
    if from_mongo:
        client = pymongo.MongoClient(mongo_uri)
        db = client["web_data"]
        collection = db["cars_raw"]
        docs = list(collection.find({}, {"_id": 0}))
        df = pd.DataFrame(docs)
        print(f"✅ Loaded {len(df)} records from MongoDB (web_data.cars_raw)")
    else:
        if not os.path.exists("data/extracted_cars.csv"):
            raise FileNotFoundError("data/extracted_cars.csv not found.")
        df = pd.read_csv("data/extracted_cars.csv")
        print(f"✅ Loaded {len(df)} rows from extracted_cars.csv")
    return df

# ==============================
# 2️⃣  Làm sạch bằng filters_car_price
# ==============================
def clean_data(df):
    clean_df, report = run_filters(df, config=default_config)
    print("🧹 Cleaning report:", report)
    return clean_df

# ==============================
# 3️⃣  Feature Engineering
# ==============================
def feature_engineering(df):
    df = df.copy()
    current_year = datetime.now().year

    # Age
    df["age"] = current_year - df["year"]
    df.loc[df["age"] < 0, "age"] = 0  # fix lỗi năm tương lai

    # km_per_year
    df["km_per_year"] = df["odometer_km"] / (df["age"] + 1)

    # log(price)
    df["price_log"] = np.log1p(df["price"])

    # Fill missing categorical with "Unknown"
    for cat_col in ["fuel", "transmission", "brand", "model", "city"]:
        if cat_col not in df.columns:
            df[cat_col] = "Unknown"
        else:
            df[cat_col] = df[cat_col].fillna("Unknown").astype(str)

    # Drop outlier extreme values
    df = df[df["price"] > 0]
    df = df[df["odometer_km"] < 1_000_000]

    return df

# ==============================
# 4️⃣  Mã hoá biến phân loại (One-Hot Encoding)
# ==============================
def encode_categorical(df, cat_cols=None):
    if cat_cols is None:
        cat_cols = ["fuel", "transmission", "brand"]

    print("🔠 One-hot encoding categorical features:", cat_cols)
    enc = OneHotEncoder(handle_unknown="ignore", sparse=False)
    encoded = enc.fit_transform(df[cat_cols])
    encoded_df = pd.DataFrame(encoded, columns=enc.get_feature_names_out(cat_cols))

    df_num = df.drop(columns=cat_cols)
    df_final = pd.concat([df_num.reset_index(drop=True),
                          encoded_df.reset_index(drop=True)], axis=1)
    return df_final

# ==============================
# 5️⃣  Xuất dữ liệu ra file CSV
# ==============================
def export_train_data(df):
    os.makedirs("data", exist_ok=True)
    csv_path = "data/train_ready.csv"
    df.to_csv(csv_path, index=False, encoding="utf-8-sig")
    print(f"💾 Exported train-ready data → {csv_path} ({len(df)} rows)")

# ==============================
# MAIN PIPELINE
# ==============================
def main():
    print("🚗 PREPROCESSING AutoTrader dataset")
    print("=" * 60)
    df = load_data(from_mongo=True)
    clean_df = clean_data(df)
    fe_df = feature_engineering(clean_df)
    final_df = encode_categorical(fe_df)
    export_train_data(final_df)
    print("✅ Done preprocessing!")

if __name__ == "__main__":
    main()
