import pickle
import sys

def inspect_pkl(filename):
    try:
        with open(filename, 'rb') as f:
            obj = pickle.load(f)
            print(f"--- {filename} ---")
            print(f"Type: {type(obj)}")
            if hasattr(obj, 'feature_names_in_'):
                print(f"Feature Names In: {obj.feature_names_in_}")
            if hasattr(obj, 'n_features_in_'):
                print(f"N Features In: {obj.n_features_in_}")
            if hasattr(obj, 'classes_'):
                print(f"Classes: {obj.classes_}")
            if hasattr(obj, 'get_feature_names_out'):
                print(f"Feature Names Out: {obj.get_feature_names_out()}")
            print("-" * 30)
    except Exception as e:
        print(f"Error reading {filename}: {e}")

if __name__ == "__main__":
    inspect_pkl("model (4).pkl")
    inspect_pkl("scaler (7).pkl")
    inspect_pkl("encoder (7).pkl")
