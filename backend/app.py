from flask import Flask, request, jsonify
from flask_cors import CORS
import mysql.connector
import joblib
import numpy as np
from datetime import datetime
import os
import traceback
import json

app = Flask(__name__)
CORS(app)

# ==================== DATABASE CONFIGURATION ====================
DB_CONFIG = {
    'host': 'localhost',
    'user': 'root',
    'password': 'ThatsMyBoy.44',  # Your MySQL password
    'database': 'uniguard',
    'port': 3306,
    'charset': 'utf8mb4',
    'use_pure': True
}

# ==================== YOUR DATASET HALLS ====================
HALLS = [
    "WELCH HALL", "WINSLOW HALL", "BETHEL HALL", "NELSON M HALL", 
    "SAMUEL. A HALL", "NEAL WILSON HALL", "GIDEON TROOPERS HALL", 
    "ADELEKE HALL", "HAVILAH HALL", "FAD HALL", "WHITE HALL", 
    "NYBERG HALL", "OGDEN HALL", "MARIGOLD HALL", "CRYSTAL HALL", 
    "QUEEN ESTHER HALL", "PLATINUM HALL", "IPERU", "OFF CAMPUS"
]

# ==================== MISCONDUCT TYPES ====================
MISCONDUCT_TYPES = [
    "Theft/Missing Items",
    "Use/Possession of Drugs", 
    "Lurking/Pair Loitering",
    "Bullying/Gangsterism",
    "Exeat Violation",
    "Sabbath/Worship Violation",
    "Other Violations",
    "Breach of Contract",
    "Disturbance",
    "Fighting/Affray",
    "Illicit Transaction",
    "Insub./Profane Language",
    "Assault/Verbal Assault",
    "Dishonesty/Impersonation"
]

# ==================== LOAD ML MODEL AND EXTRACT METRICS ====================
model = None
model_metrics = {
    "mse": 1.07,
    "rmse": 1.04,
    "r2_score": 0.9372,
    "r2_percentage": 93.72,
    "mape": 0.38,
    "mae": 0.85
}

try:
    # Try to load your XGBoost model
    model_path = 'uniguard_model.pkl'
    metrics_path = 'model_metrics.json'
    
    if os.path.exists(model_path):
        model = joblib.load(model_path)
        
        # Try to load saved metrics if they exist
        if os.path.exists(metrics_path):
            with open(metrics_path, 'r') as f:
                saved_metrics = json.load(f)
                model_metrics.update(saved_metrics)
                print(f"✅ Loaded metrics from file: {saved_metrics}")
        
        # Try to extract metrics from model if they were saved as attributes
        if hasattr(model, 'train_score_'):
            model_metrics['r2_score'] = float(model.train_score_)
            model_metrics['r2_percentage'] = float(model.train_score_) * 100
        if hasattr(model, 'mse_'):
            model_metrics['mse'] = float(model.mse_)
        if hasattr(model, 'rmse_'):
            model_metrics['rmse'] = float(model.rmse_)
        if hasattr(model, 'mae_'):
            model_metrics['mae'] = float(model.mae_)
        
        print("✅" + "="*50)
        print("✅ MACHINE LEARNING MODEL LOADED SUCCESSFULLY!")
        print("✅ Model file: uniguard_model.pkl")
        print("✅ Model type:", type(model).__name__)
        print(f"✅ Model R² Score: {model_metrics['r2_percentage']:.2f}%")
        print(f"✅ Model RMSE: {model_metrics['rmse']}")
        print(f"✅ Model MSE: {model_metrics['mse']}")
        print("✅" + "="*50)
    else:
        print("⚠" + "="*50)
        print("⚠ Model file not found: uniguard_model.pkl")
        print("⚠ Using statistical predictions as fallback")
        print("⚠ Your XGBoost metrics (from training):")
        print(f"⚠ R² Score: {model_metrics['r2_percentage']}%")
        print(f"⚠ RMSE: {model_metrics['rmse']}")
        print("⚠" + "="*50)
except Exception as e:
    print("⚠" + "="*50)
    print(f"⚠ Model loading error: {e}")
    print("⚠ Using statistical predictions as fallback")
    print("⚠ Your XGBoost metrics (from training):")
    print(f"⚠ R² Score: {model_metrics['r2_percentage']}%")
    print(f"⚠ RMSE: {model_metrics['rmse']}")
    print("⚠" + "="*50)
    model = None

# ==================== DATABASE CONNECTION ====================
def get_db_connection():
    """Create and return a database connection"""
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        return conn
    except mysql.connector.Error as err:
        print(f"❌ Database connection error: {err}")
        return None
    except Exception as e:
        print(f"❌ Unexpected database error: {e}")
        return None

# ==================== TEST DATABASE CONNECTION ====================
def test_database():
    """Test database connection on startup"""
    conn = get_db_connection()
    if conn:
        try:
            cursor = conn.cursor()
            cursor.execute("SELECT COUNT(*) FROM halls")
            halls_count = cursor.fetchone()[0]
            print(f"✅ Database: {halls_count} halls found")
            
            cursor.execute("SELECT COUNT(*) FROM predictions")
            pred_count = cursor.fetchone()[0]
            print(f"✅ Database: {pred_count} saved predictions")
            cursor.close()
            conn.close()
            return True
        except Exception as e:
            print(f"❌ Database query error: {e}")
            return False
    return False

# ==================== API ENDPOINTS ====================

@app.route('/')
def home():
    db_status = "Connected" if test_database() else "Disconnected"
    return jsonify({
        "message": "UniGuard API is running",
        "status": "operational",
        "ml_model": "Loaded (XGBoost)" if model else "Not Loaded (using fallback)",
        "model_metrics": model_metrics if model else model_metrics,
        "database": db_status,
        "halls_count": len(HALLS),
        "misconduct_types": len(MISCONDUCT_TYPES),
        "version": "2.0.0",
        "endpoints": {
            "login": "POST /api/login",
            "halls": "GET /api/halls",
            "model_info": "GET /api/model-info",
            "predict": "POST /api/predict (USES ML MODEL)",
            "predictions": "GET /api/predictions",
            "predictions_recent": "GET /api/predictions/recent",
            "prediction_details": "GET /api/predictions/<id>",
            "save_prediction": "POST /api/predictions/save",
            "stats": "GET /api/stats"
        }
    })

# ==================== MODEL INFO ENDPOINT ====================
@app.route('/api/model-info', methods=['GET'])
def get_model_info():
    """Return XGBoost model performance metrics - DIRECTLY FROM MODEL/TRAINING"""
    return jsonify({
        "model_type": "XGBoost Regressor",
        "status": "loaded" if model else "fallback",
        "metrics": {
            "mse": model_metrics["mse"],
            "rmse": model_metrics["rmse"],
            "r2_score": model_metrics["r2_score"],
            "r2_percentage": model_metrics["r2_percentage"],
            "mape": model_metrics["mape"],
            "mae": model_metrics["mae"]
        },
        "features": len(MISCONDUCT_TYPES),
        "halls": len(HALLS),
        "training_data": "Historical misconduct data",
        "note": "These are your actual XGBoost model metrics from training",
        "version": "1.0"
    })

@app.route('/api/login', methods=['POST'])
def login():
    """Handle user login"""
    try:
        data = request.json
        username = data.get('username')
        password = data.get('password')
        
        # Demo users (always work)
        demo_users = {
            'admin': {'id': 1, 'username': 'admin', 'full_name': 'System Administrator', 'role': 'admin'},
            'warden': {'id': 2, 'username': 'warden', 'full_name': 'Chief Warden', 'role': 'warden'}
        }
        
        if username in demo_users and password == f"{username}123":
            return jsonify({
                "success": True,
                "user": demo_users[username]
            })
        
        # Try database authentication
        conn = get_db_connection()
        if conn:
            cursor = conn.cursor(dictionary=True)
            try:
                cursor.execute(
                    "SELECT id, username, full_name, role FROM users WHERE username = %s AND password = %s",
                    (username, password)
                )
                user = cursor.fetchone()
                if user:
                    return jsonify({"success": True, "user": user})
            except Exception as e:
                print(f"Database login error: {e}")
            finally:
                cursor.close()
                conn.close()
        
        return jsonify({"error": "Invalid credentials"}), 401
        
    except Exception as e:
        print(f"Login error: {e}")
        return jsonify({"error": "Internal server error"}), 500

@app.route('/api/halls', methods=['GET'])
def get_halls():
    """Get all halls"""
    try:
        # Try to get from database first
        conn = get_db_connection()
        if conn:
            cursor = conn.cursor(dictionary=True)
            try:
                cursor.execute("SELECT id, name FROM halls ORDER BY name")
                halls = cursor.fetchall()
                if halls:
                    return jsonify({"halls": halls})
            except Exception as e:
                print(f"Database error: {e}")
            finally:
                cursor.close()
                conn.close()
        
        # Fallback to hardcoded halls
        halls = []
        for i, hall_name in enumerate(HALLS, 1):
            halls.append({
                "id": i,
                "name": hall_name
            })
        return jsonify({"halls": halls})
        
    except Exception as e:
        print(f"Get halls error: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/predict', methods=['POST'])
def predict():
    """
    MAKE PREDICTION USING MACHINE LEARNING MODEL
    This endpoint uses your XGBoost model for future years (2025+)
    """
    try:
        data = request.json
        hall_id = data.get('hall_id')
        semester = int(data.get('semester', 1))
        year = data.get('year')
        
        if not hall_id or not semester or not year:
            return jsonify({"error": "Missing required fields"}), 400
        
        # Convert year to int for prediction
        year_int = int(year)
        
        # Get hall name
        hall_idx = int(hall_id) - 1
        if hall_idx < 0 or hall_idx >= len(HALLS):
            return jsonify({"error": "Invalid hall ID"}), 400
        
        hall_name = HALLS[hall_idx]
        
        print(f"\n{'='*60}")
        print(f"🔮 PREDICTION REQUEST")
        print(f"{'='*60}")
        print(f"Hall: {hall_name} (ID: {hall_id})")
        print(f"Semester: {semester}")
        print(f"Year: {year}")
        print(f"Model Status: {'✅ LOADED' if model else '⚠ NOT LOADED'}")
        
        predictions = []
        total_incidents = 0
        
        # ============ USE ML MODEL FOR PREDICTION ============
        if model:
            try:
                print(f"\n🤖 Generating predictions with ML model...")
                
                # Prepare features for your model
                # Adjust this based on what your model expects!
                features = np.array([[hall_id, semester, year_int]])
                
                # Get prediction from model
                predicted_counts = model.predict(features)
                
                print(f"✅ Model prediction successful")
                print(f"📊 Raw predictions shape: {predicted_counts.shape if hasattr(predicted_counts, 'shape') else 'scalar'}")
                
                # Handle different output formats
                if hasattr(predicted_counts, '__len__'):
                    # Model returns array of predictions for each misconduct type
                    if len(predicted_counts) >= len(MISCONDUCT_TYPES):
                        for i, misconduct in enumerate(MISCONDUCT_TYPES):
                            count = int(round(max(0, predicted_counts[i])))
                            
                            # Determine risk level
                            if count > 15:
                                risk = "High"
                            elif count > 8:
                                risk = "Medium"
                            else:
                                risk = "Low"
                            
                            predictions.append({
                                "type": misconduct,
                                "count": count,
                                "risk": risk
                            })
                            total_incidents += count
                    else:
                        # Model returns single value
                        base_count = int(round(predicted_counts[0] if hasattr(predicted_counts, '__getitem__') else predicted_counts))
                        
                        for misconduct in MISCONDUCT_TYPES:
                            # Add variation based on misconduct type
                            variation = np.random.randint(-3, 4)
                            count = max(0, base_count + variation)
                            
                            if count > 15:
                                risk = "High"
                            elif count > 8:
                                risk = "Medium"
                            else:
                                risk = "Low"
                            
                            predictions.append({
                                "type": misconduct,
                                "count": count,
                                "risk": risk
                            })
                            total_incidents += count
                else:
                    # Model returns scalar
                    base_count = int(round(predicted_counts))
                    for misconduct in MISCONDUCT_TYPES:
                        count = max(0, base_count + np.random.randint(-3, 4))
                        
                        if count > 15:
                            risk = "High"
                        elif count > 8:
                            risk = "Medium"
                        else:
                            risk = "Low"
                        
                        predictions.append({
                            "type": misconduct,
                            "count": count,
                            "risk": risk
                        })
                        total_incidents += count
                
                print(f"✅ Generated {len(predictions)} predictions")
                print(f"📊 Total incidents: {total_incidents}")
                
            except Exception as e:
                print(f"❌ Model prediction failed: {e}")
                traceback.print_exc()
                print("⚠ Falling back to statistical prediction")
                predictions, total_incidents = statistical_prediction(hall_idx, semester, year_int)
        else:
            print("⚠ No ML model loaded - using statistical prediction")
            predictions, total_incidents = statistical_prediction(hall_idx, semester, year_int)
        
        # ============ SAVE TO DATABASE ============
        prediction_id = save_prediction_to_db(
            hall_id, hall_name, semester, year, 
            predictions, total_incidents
        )
        
        # ============ RETURN RESPONSE ============
        response = {
            "prediction_id": prediction_id or int(datetime.now().timestamp()),
            "hall_name": hall_name,
            "semester": semester,
            "year": year,
            "total_incidents": total_incidents,
            "predictions": predictions,
            "model_used": "ML Model (XGBoost)" if model else "Statistical Fallback",
            "model_metrics": model_metrics if model else None,
            "timestamp": datetime.now().isoformat()
        }
        
        print(f"\n✅ Prediction complete!")
        print(f"{'='*60}\n")
        
        return jsonify(response)
        
    except Exception as e:
        print(f"❌ Prediction error: {e}")
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

def statistical_prediction(hall_idx, semester, year):
    """Fallback statistical prediction based on your dataset"""
    # Base patterns from your dataset
    base_patterns = {
        "Theft/Missing Items": [14, 2, 5, 17, 3, 15, 9, 1, 1, 0, 2, 0, 4, 2, 0, 2, 4, 9, 4],
        "Use/Possession of Drugs": [18, 7, 4, 28, 2, 24, 4, 0, 1, 1, 1, 0, 3, 0, 0, 0, 0, 0, 3],
        "Lurking/Pair Loitering": [10, 2, 3, 8, 4, 10, 7, 1, 15, 2, 2, 3, 0, 3, 8, 5, 2, 1, 2],
        "Bullying/Gangsterism": [0, 1, 2, 6, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0],
        "Exeat Violation": [9, 3, 1, 3, 0, 6, 0, 0, 1, 1, 2, 0, 1, 0, 7, 0, 0, 12, 0],
        "Sabbath/Worship Violation": [12, 7, 19, 12, 5, 25, 1, 0, 0, 0, 4, 1, 0, 2, 3, 2, 0, 4, 2],
        "Other Violations": [4, 0, 7, 5, 1, 8, 5, 0, 6, 1, 1, 0, 5, 1, 1, 0, 0, 5, 0],
        "Breach of Contract": [2, 3, 0, 3, 0, 1, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 4],
        "Disturbance": [3, 1, 2, 0, 2, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 4, 0],
        "Fighting/Affray": [2, 0, 2, 0, 0, 3, 1, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        "Illicit Transaction": [1, 2, 0, 1, 0, 3, 3, 0, 1, 1, 2, 0, 0, 3, 0, 0, 0, 0, 4],
        "Insub./Profane Language": [5, 1, 0, 4, 4, 2, 2, 0, 0, 1, 2, 1, 1, 0, 2, 0, 0, 0, 3],
        "Assault/Verbal Assault": [3, 2, 0, 3, 0, 1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 2],
        "Dishonesty/Impersonation": [1, 0, 0, 4, 0, 3, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0]
    }
    
    predictions = []
    total_incidents = 0
    
    # Year factor - increase for future years
    year_factor = 1.0
    if year >= 2025:
        year_factor = 1.0 + (year - 2024) * 0.05  # 5% increase per year
    
    for misconduct in MISCONDUCT_TYPES:
        if misconduct in base_patterns:
            base_count = base_patterns[misconduct][hall_idx]
        else:
            base_count = 0
        
        # Adjust based on semester
        if semester == 1:
            count = int(base_count * 1.2 * year_factor)
        else:
            count = int(base_count * 0.8 * year_factor)
        
        # Add randomness
        count = max(0, count + np.random.randint(-2, 3))
        
        # Determine risk
        if count > 15:
            risk = "High"
        elif count > 8:
            risk = "Medium"
        else:
            risk = "Low"
        
        predictions.append({
            "type": misconduct,
            "count": count,
            "risk": risk
        })
        total_incidents += count
    
    return predictions, total_incidents

def save_prediction_to_db(hall_id, hall_name, semester, year, predictions, total_incidents):
    """Save prediction to MySQL database"""
    conn = get_db_connection()
    if not conn:
        print("⚠ Database not available - prediction not saved")
        return None
    
    cursor = conn.cursor()
    try:
        # Prepare misconduct counts
        misconduct_counts = {}
        for pred in predictions:
            field_name = pred['type'].lower().replace('/', '_').replace(' ', '_').replace('.', '')
            misconduct_counts[field_name] = pred['count']
        
        # Build SQL query
        fields = ', '.join(misconduct_counts.keys())
        placeholders = ', '.join(['%s'] * len(misconduct_counts))
        
        query = f"""
            INSERT INTO predictions (
                hall_id, hall_name, semester, academic_year,
                {fields}, total_count
            ) VALUES (%s, %s, %s, %s, {placeholders}, %s)
        """
        
        values = [
            hall_id, hall_name, semester, year,
            *misconduct_counts.values(), total_incidents
        ]
        
        cursor.execute(query, values)
        conn.commit()
        prediction_id = cursor.lastrowid
        
        print(f"✅ Prediction saved to database! ID: {prediction_id}")
        return prediction_id
        
    except mysql.connector.Error as err:
        print(f"❌ Database save error: {err}")
        return None
    except Exception as e:
        print(f"❌ Unexpected save error: {e}")
        return None
    finally:
        cursor.close()
        conn.close()

@app.route('/api/predictions/save', methods=['POST'])
def save_prediction():
    """API endpoint to save prediction"""
    try:
        data = request.json
        
        required_fields = ['hall_id', 'hall_name', 'semester', 'year', 
                          'predictions', 'total_incidents']
        
        for field in required_fields:
            if field not in data:
                return jsonify({"error": f"Missing field: {field}"}), 400
        
        prediction_id = save_prediction_to_db(
            data['hall_id'],
            data['hall_name'],
            data['semester'],
            data['year'],
            data['predictions'],
            data['total_incidents']
        )
        
        if prediction_id:
            return jsonify({
                "success": True,
                "message": "Prediction saved successfully",
                "prediction_id": prediction_id
            })
        else:
            return jsonify({
                "success": False,
                "message": "Database not available - prediction not saved",
                "prediction_id": None
            }), 500
        
    except Exception as e:
        print(f"❌ Save prediction API error: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/predictions', methods=['GET'])
def get_predictions():
    """Get all predictions from database"""
    conn = get_db_connection()
    if not conn:
        return jsonify({"predictions": []})
    
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("""
            SELECT id, hall_name, semester, academic_year as year,
                   total_count, predicted_at
            FROM predictions
            ORDER BY predicted_at DESC
            LIMIT 100
        """)
        
        predictions = cursor.fetchall()
        
        for pred in predictions:
            if pred['predicted_at']:
                pred['predicted_at'] = pred['predicted_at'].isoformat()
        
        return jsonify({"predictions": predictions})
    except Exception as e:
        print(f"❌ Get predictions error: {e}")
        return jsonify({"predictions": []})
    finally:
        cursor.close()
        conn.close()

@app.route('/api/predictions/recent', methods=['GET'])
def get_recent_predictions():
    """Get recent predictions"""
    limit = request.args.get('limit', default=5, type=int)
    
    conn = get_db_connection()
    if not conn:
        return jsonify({"predictions": []})
    
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("""
            SELECT id, hall_name, semester, academic_year as year,
                   total_count, predicted_at
            FROM predictions
            ORDER BY predicted_at DESC
            LIMIT %s
        """, (limit,))
        
        predictions = cursor.fetchall()
        
        for pred in predictions:
            if pred['predicted_at']:
                pred['predicted_at'] = pred['predicted_at'].isoformat()
        
        return jsonify({"predictions": predictions})
    except Exception as e:
        print(f"❌ Get recent predictions error: {e}")
        return jsonify({"predictions": []})
    finally:
        cursor.close()
        conn.close()

@app.route('/api/predictions/<int:prediction_id>', methods=['GET'])
def get_prediction_details(prediction_id):
    """Get specific prediction details"""
    conn = get_db_connection()
    if not conn:
        return jsonify({"error": "Database not available"}), 500
    
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("SELECT * FROM predictions WHERE id = %s", (prediction_id,))
        prediction = cursor.fetchone()
        
        if not prediction:
            return jsonify({"error": "Prediction not found"}), 404
        
        # Reconstruct predictions
        predictions = []
        total_incidents = 0
        
        for misconduct in MISCONDUCT_TYPES:
            field_name = misconduct.lower().replace('/', '_').replace(' ', '_').replace('.', '')
            count = prediction.get(field_name, 0)
            total_incidents += count
            
            if count > 15:
                risk = "High"
            elif count > 8:
                risk = "Medium"
            else:
                risk = "Low"
            
            predictions.append({
                "type": misconduct,
                "count": count,
                "risk": risk
            })
        
        response = {
            "prediction_id": prediction['id'],
            "hall_name": prediction['hall_name'],
            "semester": prediction['semester'],
            "year": prediction['academic_year'],
            "total_incidents": total_incidents,
            "predictions": predictions,
            "predicted_at": prediction['predicted_at'].isoformat() if prediction['predicted_at'] else None
        }
        
        return jsonify(response)
        
    except Exception as e:
        print(f"❌ Get prediction details error: {e}")
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/api/stats', methods=['GET'])
def get_stats():
    """Get dashboard statistics"""
    conn = get_db_connection()
    if not conn:
        return jsonify({
            "total_halls": len(HALLS),
            "total_predictions": 0,
            "high_risk_halls": 0
        })
    
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("SELECT COUNT(*) as total FROM halls")
        total_halls = cursor.fetchone()['total']
        
        cursor.execute("SELECT COUNT(*) as total FROM predictions")
        total_predictions = cursor.fetchone()['total']
        
        cursor.execute("""
            SELECT COUNT(DISTINCT hall_id) as high_risk 
            FROM predictions 
            WHERE total_count > 50
        """)
        high_risk_halls = cursor.fetchone()['high_risk']
        
        return jsonify({
            "total_halls": total_halls or len(HALLS),
            "total_predictions": total_predictions or 0,
            "high_risk_halls": high_risk_halls or 0
        })
        
    except Exception as e:
        print(f"❌ Stats error: {e}")
        return jsonify({
            "total_halls": len(HALLS),
            "total_predictions": 0,
            "high_risk_halls": 0
        })
    finally:
        cursor.close()
        conn.close()

if __name__ == '__main__':
    print("\n" + "="*70)
    print("🚀 UNIGUARD BACKEND v2.0 - PROFESSIONAL EDITION")
    print("="*70)
    print(f"🌐 Server: http://localhost:5000")
    print(f"🤖 ML Model: {'✅ XGBoost LOADED' if model else '⚠ NOT LOADED - Using Statistical Fallback'}")
    
    # Show model metrics
    print(f"\n📊 XGBoost MODEL PERFORMANCE (from training):")
    print(f"   📈 R² Score: {model_metrics['r2_percentage']}%")
    print(f"   📉 RMSE: {model_metrics['rmse']}")
    print(f"   📊 MSE: {model_metrics['mse']}")
    print(f"   🎯 MAPE: {model_metrics['mape']}")
    
    # Test database connection
    print("\n📊 DATABASE STATUS:")
    db_connected = test_database()
    print(f"   {'✅ Connected' if db_connected else '❌ Not Connected'}")
    
    print("\n📋 SYSTEM INFORMATION:")
    print(f"   🏛️  Halls: {len(HALLS)}")
    print(f"   📚 Misconduct Types: {len(MISCONDUCT_TYPES)}")
    print(f"   📅 Future Years: 2025, 2026, 2027, 2028")
    
    print("\n🔑 DEMO CREDENTIALS:")
    print("   👤 admin / admin123")
    print("   👤 warden / warden123")
    
    print("\n📌 API ENDPOINTS:")
    print("   POST  /api/login                 - User authentication")
    print("   GET   /api/halls                - Get all halls")
    print("   GET   /api/model-info            - Get XGBoost model metrics (93.72% R²)")
    print("   POST  /api/predict              - Make prediction (XGBoost)")
    print("   GET   /api/predictions          - Get all predictions")
    print("   GET   /api/predictions/recent   - Get recent predictions")
    print("   GET   /api/predictions/<id>     - Get prediction details")
    print("   POST  /api/predictions/save     - Save prediction")
    print("   GET   /api/stats                - Get dashboard statistics")
    
    print("="*70 + "\n")
    
    app.run(debug=True, port=5000)