from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import json
import csv
import os
from datetime import datetime
import uuid

app = Flask(__name__)
CORS(app)  # Allow frontend to connect

# Store data in memory (in production, use a database)
data_storage = []

# Create data directory if it doesn't exist
os.makedirs('data', exist_ok=True)

@app.route('/api/health', methods=['GET'])
def health_check():
    """Simple health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'total_records': len(data_storage)
    })

@app.route('/api/submit', methods=['POST'])
def submit_data():
    """Endpoint to submit research data"""
    try:
        data = request.json
        
        # Basic validation
        required_fields = ['sessionId', 'performance', 'satisfaction', 'demographic']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing field: {field}'}), 400
        
        # Add timestamp and unique ID
        data['submissionId'] = str(uuid.uuid4())
        data['receivedAt'] = datetime.now().isoformat()
        
        # Store data
        data_storage.append(data)
        
        # Also save to file
        with open(f'data/submission_{data["submissionId"]}.json', 'w') as f:
            json.dump(data, f, indent=2)
        
        print(f"📥 Received data from session: {data['sessionId']}")
        
        return jsonify({
            'success': True,
            'message': 'Data received successfully',
            'submissionId': data['submissionId'],
            'totalSubmissions': len(data_storage)
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/export/csv', methods=['GET'])
def export_csv():
    """Export all data as CSV"""
    try:
        if not data_storage:
            return jsonify({'error': 'No data available'}), 404
        
        # Create CSV file
        filename = f'data/lms_export_{datetime.now().strftime("%Y%m%d_%H%M%S")}.csv'
        
        # Define CSV columns
        fieldnames = [
            'submissionId', 'sessionId', 'receivedAt',
            'responseTime', 'pageLoadTime', 'errorRate',
            'usabilityRating', 'satisfactionRating',
            'academicLevel', 'deviceType'
        ]
        
        with open(filename, 'w', newline='') as csvfile:
            writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
            writer.writeheader()
            
            for record in data_storage:
                writer.writerow({
                    'submissionId': record.get('submissionId', ''),
                    'sessionId': record.get('sessionId', ''),
                    'receivedAt': record.get('receivedAt', ''),
                    'responseTime': record.get('performance', {}).get('responseTime', ''),
                    'pageLoadTime': record.get('performance', {}).get('pageLoadTime', ''),
                    'errorRate': record.get('performance', {}).get('errorRate', ''),
                    'usabilityRating': record.get('satisfaction', {}).get('usabilityRating', ''),
                    'satisfactionRating': record.get('satisfaction', {}).get('satisfactionRating', ''),
                    'academicLevel': record.get('demographic', {}).get('academicLevel', ''),
                    'deviceType': record.get('demographic', {}).get('deviceType', '')
                })
        
        return jsonify({
            'success': True,
            'message': f'Exported {len(data_storage)} records',
            'filename': filename,
            'downloadUrl': f'/api/download/{os.path.basename(filename)}'
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/download/<filename>', methods=['GET'])
def download_file(filename):
    """Download a file"""
    try:
        filepath = os.path.join('data', filename)
        if os.path.exists(filepath):
            return send_file(filepath, as_attachment=True)
        else:
            return jsonify({'error': 'File not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/data', methods=['GET'])
def get_all_data():
    """Get all stored data"""
    return jsonify({
        'success': True,
        'count': len(data_storage),
        'data': data_storage
    })

@app.route('/api/stats', methods=['GET'])
def get_statistics():
    """Get basic statistics"""
    if not data_storage:
        return jsonify({'error': 'No data available'}), 404
    
    response_times = [float(r.get('performance', {}).get('responseTime', 0)) 
                     for r in data_storage if r.get('performance', {}).get('responseTime')]
    usability_ratings = [int(r.get('satisfaction', {}).get('usabilityRating', 0)) 
                        for r in data_storage if r.get('satisfaction', {}).get('usabilityRating')]
    
    stats = {
        'totalSubmissions': len(data_storage),
        'avgResponseTime': sum(response_times) / len(response_times) if response_times else 0,
        'avgUsabilityRating': sum(usability_ratings) / len(usability_ratings) if usability_ratings else 0,
        'deviceTypes': {},
        'academicLevels': {}
    }
    
    # Count device types
    for record in data_storage:
        device = record.get('demographic', {}).get('deviceType', 'Unknown')
        stats['deviceTypes'][device] = stats['deviceTypes'].get(device, 0) + 1
        
        level = record.get('demographic', {}).get('academicLevel', 'Unknown')
        stats['academicLevels'][level] = stats['academicLevels'].get(level, 0) + 1
    
    return jsonify({'success': True, 'statistics': stats})

if __name__ == '__main__':
    print("🚀 Starting LMS Research Tool Backend...")
    print("📊 API Endpoints:")
    print("  • GET  /api/health     - Health check")
    print("  • POST /api/submit     - Submit data")
    print("  • GET  /api/export/csv - Export CSV")
    print("  • GET  /api/data       - View all data")
    print("  • GET  /api/stats      - View statistics")
    print("\n🌐 Server running at: http://localhost:5000")
    app.run(debug=True, port=5000)