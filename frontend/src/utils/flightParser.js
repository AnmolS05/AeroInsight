import Papa from 'papaparse';

export const parseFlightLog = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const fileContent = event.target.result;
        let jsonData;
        
        if (file.name.toLowerCase().endsWith('.csv')) {
          const parsed = Papa.parse(fileContent, {
            header: true,
            dynamicTyping: true,
            skipEmptyLines: true,
            transformHeader: h => h.trim().toLowerCase()
          });
          
          // Map data and generate a mock flight path if GPS coordinates are missing
          let currentLat = 37.7749;
          let currentLng = -122.4194;
          
          jsonData = parsed.data.map((row, index) => {
            const alt = row['altitude (meters)'] ?? row.altitude ?? row.alt ?? 0;
            const bat = row['battery remaining (%)'] ?? row.battery ?? row.bat ?? 100;
            const issue = row['notes'] ?? row['obstacles encountered'] ?? row.issue ?? 'none';
            const time = row['flight date'] ?? row.timestamp ?? new Date(Date.now() + index * 60000).toISOString();
            
            let lat = row.latitude ?? row.lat;
            let lng = row.longitude ?? row.lng;
            
            if (lat === undefined || lng === undefined) {
               currentLat += (Math.random() - 0.5) * 0.01;
               currentLng += (Math.random() - 0.5) * 0.01;
               lat = currentLat;
               lng = currentLng;
            }

            return {
              latitude: Number(lat) || 0,
              longitude: Number(lng) || 0,
              altitude: Number(alt) || 0,
              battery: Number(bat) || 0,
              issue: String(issue),
              timestamp: String(time)
            };
          });
        } else {
          jsonData = JSON.parse(fileContent);
        }
        
        if (!Array.isArray(jsonData) || jsonData.length === 0) {
          throw new Error('Invalid data format: Expected a non-empty array of telemetry objects.');
        }

        resolve(jsonData);
      } catch (err) {
        reject(err);
      }
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
};
