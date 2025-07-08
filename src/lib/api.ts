import Papa from 'papaparse';

export interface PrayerTime {
  name: string;
  time: string;
  iqamah?: string;
}

export interface Event {
  title: string;
  date: string;
  time?: string;
  description?: string;
}

type PrayerRow = {
  [key: string]: string | undefined;
};

export async function fetchPrayerTimes(): Promise<PrayerTime[]> {
  try {
    const response = await fetch('/prayer_times.csv');
    const csvText = await response.text();

    // Parse the CSV data
    const parsed = Papa.parse(csvText, { header: true, skipEmptyLines: true });
    const data = parsed.data as PrayerRow[];

    // Format today's date as in the CSV, e.g. "June 25, 2025"
    const today = new Date();
    const month = today.toLocaleString('default', { month: 'long' });
    const day = today.getDate();
    const year = today.getFullYear();
    const todayStr = `${month} ${day}, ${year}`;

    // Debug: log today's string and all parsed dates
    console.log("Today's string:", todayStr);
    console.log("CSV Headers:", parsed.meta.fields);

    // Find today's row - the date is in the "June" field (first column)
    // Skip the header row which has "Date" in the June field
    const todayRow = data.find(row => {
      const dateField = row['June']; // The date is in the "June" column
      return dateField && 
             dateField.replace(/"/g, '').trim() === todayStr &&
             dateField !== 'Date' && // Skip the header row
             row['Fajr'] && // Only true data rows have prayer times
             row['Fajr'] !== 'Begins'; // Skip the sub-header row
    });

    // Debug: log the matched row
    console.log("Today's row:", todayRow);

    if (todayRow) {
      return [
        { name: 'Fajr', time: todayRow['Fajr'] || '', iqamah: todayRow['_1'] || '' },
        { name: 'Sunrise', time: todayRow['_2'] || '' },
        { name: 'Dhuhr', time: todayRow['Dhuhr'] || '', iqamah: todayRow['_3'] || '' },
        { name: 'Asr', time: todayRow['Asr'] || '', iqamah: todayRow['_5'] || '' }, // Using Standard time
        { name: 'Maghrib', time: todayRow['Maghrib'] || '', iqamah: todayRow['_6'] || '' },
        { name: 'Isha', time: todayRow['Isha'] || '', iqamah: todayRow['_7'] || '' },
      ];
    }

    // Fallback to default times if today's data not found
    console.log("Today's prayer times not found in CSV, using defaults");
    const defaultPrayerTimes: PrayerTime[] = [
      { name: "Fajr", time: "5:45 AM", iqamah: "6:15 AM" },
      { name: "Sunrise", time: "6:48 AM" },
      { name: "Dhuhr", time: "1:23 PM", iqamah: "1:45 PM" },
      { name: "Asr", time: "4:45 PM", iqamah: "5:00 PM" },
      { name: "Maghrib", time: "7:58 PM", iqamah: "8:00 PM" },
      { name: "Isha", time: "9:23 PM", iqamah: "9:45 PM" }
    ];

    return defaultPrayerTimes;
  } catch (error) {
    console.error('Error fetching prayer times:', error);
    return [];
  }
}

export async function fetchEvents(): Promise<Event[]> {
  try {
    const response = await fetch('/calendar.ics');
    const icsData = await response.text();
    // console.log("Fetched ICS data:", icsData);

    const events: Event[] = [];
    // Normalize line endings and split
    const lines = icsData.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
    let currentEvent: Partial<Event> = {};
    let inEvent = false;

    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];
      if (!line) continue;

      if (line === 'BEGIN:VEVENT') {
        inEvent = true;
        currentEvent = {};
        continue;
      }

      if (line === 'END:VEVENT') {
        inEvent = false;
        if (currentEvent.title && currentEvent.date) {
            events.push(currentEvent as Event);
        }
        continue;
      }
      
      if (!inEvent) continue;

      // Line folding
      while (i + 1 < lines.length && (lines[i + 1].startsWith(' ') || lines[i + 1].startsWith('\t'))) {
        line += lines[i + 1].substring(1);
        i++;
      }
      
      const separatorIndex = line.indexOf(':');
      if (separatorIndex === -1) continue;

      const key = line.substring(0, separatorIndex);
      let value = line.substring(separatorIndex + 1);

      // Unescape common characters
      value = value.replace(/\\n/g, '\n').replace(/\\,/g, ',').replace(/\\;/g, ';').replace(/\\\\/g, '\\');

      const keyParts = key.split(';');
      const mainKey = keyParts[0];

      switch (mainKey) {
        case 'SUMMARY':
          currentEvent.title = value;
          break;
        case 'DESCRIPTION':
          currentEvent.description = value;
          break;
        case 'DTSTART':
        case 'DTEND': // Can be used to calculate duration if needed, for now just parse start
          if (mainKey === 'DTSTART') {
            const dateStr = value.split('T');
            const datePart = dateStr[0];
            const timePart = dateStr.length > 1 ? dateStr[1] : '';

            const year = parseInt(datePart.substring(0, 4));
            const month = parseInt(datePart.substring(4, 6)) - 1;
            const day = parseInt(datePart.substring(6, 8));

            if (timePart) {
                const hour = parseInt(timePart.substring(0, 2));
                const minute = parseInt(timePart.substring(2, 4));
                const date = new Date(Date.UTC(year, month, day, hour, minute));
                
                currentEvent.date = date.toLocaleDateString(undefined, {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                    timeZone: 'UTC'
                });
                currentEvent.time = date.toLocaleTimeString(undefined, {
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true,
                    timeZone: 'UTC'
                });
            } else {
                const date = new Date(Date.UTC(year, month, day));
                currentEvent.date = date.toLocaleDateString(undefined, {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                    timeZone: 'UTC'
                });
                currentEvent.time = 'All day';
            }
          }
          break;
      }
    }

    // console.log("Parsed events:", events);

    // Sort events by date
    return events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  } catch (error) {
    console.error('Error fetching events:', error);
    return [];
  }
}