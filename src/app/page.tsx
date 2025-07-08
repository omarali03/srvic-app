'use client';
import * as React from "react"
import { useEffect, useState } from "react";
import { Card, CardContent } from "../components/ui/card";
import { Tabs, TabsContent } from "../components/ui/tabs";
import { Clock3, CalendarDays, Image, PhoneCall, Moon, Sun } from "lucide-react";
import { fetchPrayerTimes, fetchEvents, type PrayerTime, type Event } from "../lib/api";

function getTimeInMinutes(timeStr: string): number {
  const [time, period] = timeStr.split(' ');
  const [hours, minutes] = time.split(':').map(Number);
  let totalMinutes = hours * 60 + minutes;
  
  // Convert to 24-hour format if needed
  if (period === 'PM' && hours !== 12) {
    totalMinutes += 12 * 60;
  } else if (period === 'AM' && hours === 12) {
    totalMinutes = minutes;
  }
  
  return totalMinutes;
}

function formatTimeUntil(minutesUntil: number): string {
  if (minutesUntil < 60) {
    return `${minutesUntil} minutes`;
  }
  const hours = Math.floor(minutesUntil / 60);
  const minutes = minutesUntil % 60;
  return `${hours} hour${hours > 1 ? 's' : ''} ${minutes} minute${minutes !== 1 ? 's' : ''}`;
}

export default function PrayerHome() {
  const [prayerTimes, setPrayerTimes] = useState<PrayerTime[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [tab, setTab] = useState("prayers");
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  useEffect(() => {
    fetchPrayerTimes().then(setPrayerTimes);
    fetchEvents().then(setEvents);
  }, []);

  // Find current prayer and next prayer
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  
  let currentPrayer: PrayerTime | null = null;
  let nextPrayer: PrayerTime | null = null;
  let minutesUntilNext = 0;

  for (let i = 0; i < prayerTimes.length; i++) {
    const prayer = prayerTimes[i];
    const nextPrayerIndex = (i + 1) % prayerTimes.length;
    
    if (!prayer.time) continue;
    
    const prayerMinutes = getTimeInMinutes(prayer.time);
    let nextPrayerMinutes = getTimeInMinutes(prayerTimes[nextPrayerIndex].time || '');
    
    // Handle day boundary
    if (nextPrayerMinutes < prayerMinutes) {
      nextPrayerMinutes += 24 * 60;
    }
    
    if (currentMinutes >= prayerMinutes && 
        (nextPrayerIndex === 0 ? currentMinutes < 24 * 60 : currentMinutes < nextPrayerMinutes)) {
      currentPrayer = prayer;
      nextPrayer = prayerTimes[nextPrayerIndex];
      
      // Calculate minutes until next prayer
      if (nextPrayerMinutes < prayerMinutes) {
        // Next prayer is tomorrow
        minutesUntilNext = (24 * 60 - currentMinutes) + nextPrayerMinutes;
      } else {
        minutesUntilNext = nextPrayerMinutes - currentMinutes;
      }
      break;
    }
  }

  // If no current prayer was found, we're before the first prayer of the day
  if (!currentPrayer && prayerTimes.length > 0) {
    currentPrayer = prayerTimes[prayerTimes.length - 1]; // Last prayer of previous day
    nextPrayer = prayerTimes[0]; // First prayer of current day
    minutesUntilNext = getTimeInMinutes(prayerTimes[0].time || '') - currentMinutes;
    if (minutesUntilNext < 0) {
      minutesUntilNext += 24 * 60;
    }
  }

  // Tab configuration for iOS-style bottom nav
  const tabs = [
    { id: "prayers", label: "Prayers", icon: Clock3 },
    { id: "events", label: "Events", icon: CalendarDays },
    { id: "media", label: "Media", icon: Image },
    { id: "contact", label: "Contact", icon: PhoneCall },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-800 to-emerald-600 text-white">
      {/* Safe Area Top Padding for Mobile */}
      <div className="h-safe-top bg-emerald-800" />
      
      {/* Header */}
      <div className="px-4 pt-4 pb-2 flex justify-between items-center bg-emerald-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">SRVIC</h1>
          <p className="text-sm text-emerald-100">San Ramon Valley Islamic Center</p>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="https://www.paypal.com/donate?token=A770cxM8o3Gj_kPPtv1IK5jSPh6lZYPzYygM6nwyHzsgs7E0X_VqO6Dt7eu6FEN-cfyOUQ1Uh1C4vpjM"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white/10 hover:bg-white/20 backdrop-blur-md text-white rounded-full px-4 py-1.5 text-sm font-semibold flex items-center gap-1.5 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" className="w-3.5 h-3.5 fill-current">
              <path d="M111.4 295.9c-3.5 19.2-17.4 108.7-21.5 134-.3 1.8-1 2.5-3 2.5H12.3c-7.6 0-13.1-6.6-12.1-13.9L58.8 46.6c1.5-9.6 10.1-16.9 20-16.9 152.3 0 165.1-3.7 204 11.4 60.1 23.3 65.6 79.5 44 140.3-21.5 62.6-72.5 89.5-140.1 90.3-43.4.7-69.5-7-75.3 24.2zM357.1 152c-1.8-1.3-2.5-1.8-3 1.3-2 11.4-5.1 22.5-8.8 33.6-39.9 113.8-150.5 103.9-204.5 103.9-6.1 0-10.1 3.3-10.9 9.4-22.6 140.4-27.1 169.7-27.1 169.7-1 7.1 3.5 12.9 10.6 12.9h63.5c8.6 0 15.7-6.3 17.4-14.9.7-5.4-1.1 6.1 14.4-91.3 4.6-22 14.3-19.7 29.3-19.7 71 0 126.4-28.8 142.9-112.3 6.5-34.8 4.6-71.4-23.8-92.6z"/>
            </svg>
            Donate
          </a>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="flex flex-col h-[calc(100vh-8rem)]">
        {/* Content Area - Scrollable with bottom padding for tab bar */}
        <div className="flex-1 overflow-y-auto pb-24 px-4">
          <TabsContent value="prayers" className="mt-4 space-y-4">
            {/* Current Prayer */}
            <Card className="bg-white/10 backdrop-blur-md border-white/20 text-white rounded-2xl shadow-lg">
              <CardContent className="py-4 px-6">
                <p className="text-sm text-white/70 mb-1">Current Prayer</p>
                {currentPrayer ? (
                  <>
                    <h2 className="text-2xl font-bold">{currentPrayer.name} - {currentPrayer.time}</h2>
                    {nextPrayer && (
                      <div className="mt-2">
                        <p className="text-sm text-white/70">Next Prayer</p>
                        <p className="text-lg font-semibold">{nextPrayer.name} - {nextPrayer.time}</p>
                        <p className="text-sm text-white/70 mt-1">
                          {"Time until next prayer: " + formatTimeUntil(minutesUntilNext)}
                        </p>
                        {nextPrayer.iqamah && (
                          <p className="text-sm text-emerald-200 mt-1">
                            {"Iqamah: " + nextPrayer.iqamah}
                          </p>
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <h2 className="text-2xl font-bold">{"Loading prayer times..."}</h2>
                )}
              </CardContent>
            </Card>

            {/* Prayer Times */}
            <Card className="bg-white rounded-2xl shadow-md">
              <CardContent className="px-4 py-3">
                <h3 className="text-lg font-semibold text-gray-700 mb-2">{"Today's Prayer Times"}</h3>
                {prayerTimes.length > 0 ? (
                  <ul className="divide-y divide-gray-200">
                    {prayerTimes.map((p) => (
                      <li key={p.name} className="flex justify-between items-center py-2">
                        <div className="flex items-center gap-2">
                          {p.name.toLowerCase().includes('fajr') && <span className="text-emerald-700"><Moon size={18} /></span>}
                          {p.name.toLowerCase().includes('dhuhr') && <span className="text-emerald-700"><Sun size={18} /></span>}
                          <span className="font-medium text-gray-800">{p.name}</span>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-600">{p.time}</p>
                          {p.iqamah && (
                            <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full text-xs font-semibold">
                              {p.iqamah}
                            </span>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500 text-center py-4">No prayer times available</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="events" className="mt-4 space-y-4">
            {events.length > 0 ? (
              events.map((event, index) => (
                <Card key={index} className="bg-white rounded-2xl shadow-md overflow-hidden">
                  <CardContent className="p-5">
                    <h4 className="text-gray-900 font-bold text-lg mb-3">{event.title}</h4>
                    <div className="flex items-center text-emerald-700 text-sm mb-2">
                      <CalendarDays size={14} className="mr-2 flex-shrink-0" />
                      <span className="font-medium">{event.date}</span>
                      {event.time && event.time !== 'All day' && (
                        <>
                          <span className="text-gray-400 mx-2">|</span>
                          <Clock3 size={14} className="mr-1.5 flex-shrink-0" />
                          <span className="font-medium">{event.time}</span>
                        </>
                      )}
                    </div>
                    {event.description && (
                      <button
                        className="text-emerald-700 text-xs font-semibold underline mb-2 focus:outline-none"
                        onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}
                        type="button"
                      >
                        {expandedIndex === index ? 'Hide Details' : 'Show Details'}
                      </button>
                    )}
                    {event.description && expandedIndex === index && (
                      <p
                        className="text-gray-600 text-sm mt-2"
                        style={{ whiteSpace: 'pre-line' }}
                      >
                        {event.description}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card className="bg-white rounded-2xl shadow-md">
                <CardContent className="p-4 text-center text-gray-500">
                  No upcoming events
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="media" className="mt-4 space-y-4">
            <Card className="bg-white rounded-2xl shadow-md">
              <CardContent className="p-4">
                <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816z"/>
                    <path d="M12 8.689L17.326 12 12 15.311z"/>
                  </svg>
                  Recent Videos
                </h3>
                <div className="space-y-4">
                  <a href="https://www.youtube.com/watch?v=example1" className="block">
                    <div className="flex gap-3">
                      <div className="w-32 h-20 bg-gray-100 rounded-lg"></div>
                      <div>
                        <h4 className="text-gray-800 font-medium line-clamp-2">Juma Khutbah - The Importance of Ramadan</h4>
                        <p className="text-gray-500 text-sm mt-1">2 days ago</p>
                      </div>
                    </div>
                  </a>
                </div>
                <a href="https://www.youtube.com/@sanramonvalleyislamiccente327" 
                   className="inline-flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-full mt-4 text-sm font-medium">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816z"/>
                    <path d="M12 8.689L17.326 12 12 15.311z"/>
                  </svg>
                  Subscribe to Our Channel
                </a>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contact" className="mt-4">
            <Card className="bg-white rounded-2xl shadow-md">
              <CardContent className="p-6 text-center">
                <h3 className="text-xl font-semibold text-gray-700 mb-4">Contact Information</h3>
                <p className="font-semibold text-gray-800">San Ramon Valley Islamic Center</p>
                <a 
                  href="https://maps.google.com/?q=2232+Camino+Ramon,+San+Ramon,+CA+94583"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-600 mt-2 block hover:text-emerald-600 transition-colors"
                >
                  📍 2232 Camino Ramon, San Ramon, CA 94583
                </a>
                <a 
                  href="https://srvic.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-600 block hover:text-emerald-600 transition-colors"
                >
                  🌐 srvic.org
                </a>
                <div className="mt-4 flex items-center justify-center gap-2">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                  <span className="text-gray-700">Center Status: Open</span>
                </div>
                <div className="mt-6 text-sm text-gray-500">
                  <p>Center is CLOSED on SUNDAYS</p>
                  <p>10:30-1:30pm during Islamic School</p>
                </div>
                {/* Donation Section */}
                <div className="mt-8 pt-8 border-t border-gray-200">
                  <h4 className="text-lg font-semibold text-gray-700 mb-3">Support Our Center</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    Your donations help us maintain and improve our services for the community.
                  </p>
                  <a
                    href="https://www.paypal.com/donate?token=A770cxM8o3Gj_kPPtv1IK5jSPh6lZYPzYygM6nwyHzsgs7E0X_VqO6Dt7eu6FEN-cfyOUQ1Uh1C4vpjM"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-[#0070BA] text-white px-6 py-2 rounded-full font-medium hover:bg-[#003087] transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" className="w-4 h-4 fill-current">
                      <path d="M111.4 295.9c-3.5 19.2-17.4 108.7-21.5 134-.3 1.8-1 2.5-3 2.5H12.3c-7.6 0-13.1-6.6-12.1-13.9L58.8 46.6c1.5-9.6 10.1-16.9 20-16.9 152.3 0 165.1-3.7 204 11.4 60.1 23.3 65.6 79.5 44 140.3-21.5 62.6-72.5 89.5-140.1 90.3-43.4.7-69.5-7-75.3 24.2zM357.1 152c-1.8-1.3-2.5-1.8-3 1.3-2 11.4-5.1 22.5-8.8 33.6-39.9 113.8-150.5 103.9-204.5 103.9-6.1 0-10.1 3.3-10.9 9.4-22.6 140.4-27.1 169.7-27.1 169.7-1 7.1 3.5 12.9 10.6 12.9h63.5c8.6 0 15.7-6.3 17.4-14.9.7-5.4-1.1 6.1 14.4-91.3 4.6-22 14.3-19.7 29.3-19.7 71 0 126.4-28.8 142.9-112.3 6.5-34.8 4.6-71.4-23.8-92.6z"/>
                    </svg>
                    Donate with PayPal
                  </a>
                  <p className="text-xs text-gray-500 mt-3">
                    All donations are tax-deductible. Tax ID available upon request.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </div>

        {/* iOS-Style Bottom Tab Bar */}
        <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-gray-100 safe-area-pb">
          <div className="flex justify-around items-center px-2 pt-2 pb-1">
            {tabs.map((tabConfig) => {
              const Icon = tabConfig.icon;
              const isActive = tab === tabConfig.id;
              
              return (
                <button
                  key={tabConfig.id}
                  onClick={() => setTab(tabConfig.id)}
                  className="flex flex-col items-center justify-center px-4 py-1 min-w-0 transition-all duration-300 ease-out"
                >
                  <div className={`flex flex-col items-center transition-all duration-300 ease-out ${
                    isActive ? 'transform -translate-y-0.5' : ''
                  }`}>
                    <Icon 
                      size={isActive ? 26 : 22} 
                      className={`transition-all duration-300 ease-out ${
                        isActive 
                          ? 'text-emerald-600 drop-shadow-sm' 
                          : 'text-gray-500'
                      }`}
                      strokeWidth={isActive ? 2.5 : 2}
                    />
                    <span 
                      className={`text-xs font-medium mt-1 transition-all duration-300 ease-out ${
                        isActive 
                          ? 'text-emerald-600' 
                          : 'text-gray-500'
                      }`}
                    >
                      {tabConfig.label}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </Tabs>
    </div>
  );
}