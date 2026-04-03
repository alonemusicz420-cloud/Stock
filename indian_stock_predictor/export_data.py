import os
import json
import shutil

def export_data_for_frontend():
    predictor_dir = os.path.dirname(os.path.abspath(__file__))
    frontend_dir = os.path.join(os.path.dirname(predictor_dir), 'nifty-predictor-frontend', 'public', 'data')
    
    os.makedirs(frontend_dir, exist_ok=True)
    
    src = os.path.join(predictor_dir, 'results', 'all_predictions.json')
    if os.path.exists(src):
        shutil.copy2(src, os.path.join(frontend_dir, 'all_predictions.json'))
        print("[+] Exported all_predictions.json")
    else:
        print("[-] Run main.py first")

if __name__ == "__main__":
    export_data_for_frontend()
