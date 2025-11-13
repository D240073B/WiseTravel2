<?php
require_once '../vendor/autoload.php';
require_once '../app/Core/Database.php';

use App\Core\Database;

try {
    $db = Database::getInstance()->getConnection();
    
    echo "=== Resetting to 15 core Malaysian destinations ===" . PHP_EOL;
    
    // Disable foreign key checks temporarily
    $db->exec("SET FOREIGN_KEY_CHECKS = 0");
    
    // Delete all existing destinations
    $db->exec("DELETE FROM destinations");
    
    // Reset auto increment
    $db->exec("ALTER TABLE destinations AUTO_INCREMENT = 1");
    
    // Insert the 15 core destinations
    $destinations = [
        [
            'id' => 1, 
            'name' => 'Kuala Lumpur', 
            'country' => 'Malaysia', 
            'description' => 'Capital city with iconic Twin Towers',
            'travel_tips' => 'Best time to visit: May-July & December-February. Use Grab for transport. Try local food at Jalan Alor. Visit Petronas Twin Towers early morning for shorter queues. Take the KL Hop-On Hop-Off bus for easy sightseeing. Bargain at Central Market. Stay hydrated and bring umbrella for sudden rain.'
        ],
        [
            'id' => 2, 
            'name' => 'George Town, Penang', 
            'country' => 'Malaysia', 
            'description' => 'UNESCO World Heritage site with rich culture',
            'travel_tips' => 'Best time: December-March. Must-try: Penang laksa, char kway teow, assam laksa. Walk or cycle around heritage area. Visit during Chinese New Year for festive atmosphere. Take ferry from Butterworth for scenic arrival. Try street art hunting in Armenian Street. Book accommodation early during festivals.'
        ],
        [
            'id' => 3, 
            'name' => 'Johor Bahru', 
            'country' => 'Malaysia', 
            'description' => 'Southern gateway city near Singapore',
            'travel_tips' => 'Best time: March-September. Easy day trip from Singapore. Try local durian if in season. Visit Legoland Malaysia for families. Use Malaysian Ringgit for better exchange rates. Check passport validity for Singapore border crossing. Stay near City Square or KSL Mall for shopping and dining.'
        ],
        [
            'id' => 4, 
            'name' => 'Ipoh', 
            'country' => 'Malaysia', 
            'description' => 'Charming city famous for white coffee and lime caves',
            'travel_tips' => 'Best time: December-February. Must-try: Ipoh white coffee, bean sprout chicken, salted chicken. Visit Sam Poh Tong Cave Temple and Kek Lok Tong. Explore Old Town for heritage buildings and street art. Take day trip to Kellie\'s Castle. Book Ipoh-KL train tickets in advance.'
        ],
        [
            'id' => 5, 
            'name' => 'Kota Kinabalu', 
            'country' => 'Malaysia', 
            'description' => 'Sabah capital with stunning sunsets and Mount Kinabalu',
            'travel_tips' => 'Best time: March-September (dry season). Must-see: Signal Hill Observatory for sunset, Filipino Market for seafood. Book Mount Kinabalu climb well in advance. Try hinava (raw fish salad) and ambuyat. Use local buses or Grab for transport. Bring insect repellent for island trips.'
        ],
        [
            'id' => 6, 
            'name' => 'Kuching', 
            'country' => 'Malaysia', 
            'description' => 'Cat city of Sarawak with wildlife and culture',
            'travel_tips' => 'Best time: April-September. Must-visit: Semenggoh Wildlife Centre for orangutans, Sarawak Cultural Village. Try Sarawak laksa, kolo mee, layer cake. Book longhouse visits through tour operators. Bring rain gear for sudden showers. Visit cat statues around the city for photos.'
        ],
        [
            'id' => 7, 
            'name' => 'Melaka', 
            'country' => 'Malaysia', 
            'description' => 'Historic city with Portuguese and Dutch heritage',
            'travel_tips' => 'Best time: December-February. Walk around Chinatown and Dutch Square. Try cendol, chicken rice balls, nyonya cuisine. Take trishaw rides for city tour. Visit A Famosa fort ruins and St. Paul\'s Church. Book river cruise for evening views. Weekend nights can be very crowded.'
        ],
        [
            'id' => 8, 
            'name' => 'Langkawi', 
            'country' => 'Malaysia', 
            'description' => 'Tropical island paradise with duty-free shopping',
            'travel_tips' => 'Best time: November-April. Must-do: Cable car to Mount Mat Cincang, island hopping tour, Underwater World. Rent a car for easy island exploration. Take advantage of duty-free alcohol and chocolate. Book accommodation near Pantai Cenang for nightlife and restaurants. Bring sunscreen and stay hydrated.'
        ],
        [
            'id' => 9, 
            'name' => 'Cameron Highlands', 
            'country' => 'Malaysia', 
            'description' => 'Cool mountain retreat with tea plantations',
            'travel_tips' => 'Best time: March-September. Bring warm clothes (15-25°C). Must-visit: BOH Tea Plantation, Strawberry farms, Mossy Forest. Try steamboat and local strawberries. Book accommodation early during school holidays. Rent a car or join guided tours for tea plantation visits. Pack rain jacket for afternoon showers.'
        ],
        [
            'id' => 10, 
            'name' => 'Tioman Island', 
            'country' => 'Malaysia', 
            'description' => 'Pristine island with crystal clear waters',
            'travel_tips' => 'Best time: March-October (avoid monsoon season). Ferry from Mersing or Tanjung Gemok. Book accommodation in advance, limited options available. Bring cash as limited ATMs. Great for snorkeling and diving. Try local seafood at beachside restaurants. Pack insect repellent and reef-safe sunscreen.'
        ],
        [
            'id' => 11, 
            'name' => 'Redang Island', 
            'country' => 'Malaysia', 
            'description' => 'Marine park with excellent diving and snorkeling',
            'travel_tips' => 'Best time: March-October. Closed during monsoon (November-February). Ferry from Kuala Terengganu or Merang. Most resorts offer package deals including meals. Perfect for diving and snorkeling. Limited internet connectivity. Bring underwater camera and marine life identification guide.'
        ],
        [
            'id' => 12, 
            'name' => 'Perhentian Islands', 
            'country' => 'Malaysia', 
            'description' => 'Twin islands with white sandy beaches',
            'travel_tips' => 'Best time: March-October. Choose Perhentian Besar for families, Perhentian Kecil for backpackers. Ferry from Kuala Besut. No ATMs on islands, bring sufficient cash. Excellent snorkeling spots around coral reefs. Try local fish curry and fresh coconut water. Book early for peak season (June-August).'
        ],
        [
            'id' => 13, 
            'name' => 'Taman Negara', 
            'country' => 'Malaysia', 
            'description' => 'Ancient rainforest with wildlife and canopy walks',
            'travel_tips' => 'Best time: February-September (dry season). Book canopy walk early morning for better wildlife spotting. Bring insect repellent, long sleeves, and proper trekking shoes. Join guided night walks for nocturnal animals. Try river tubing and rapid shooting. Stay in Kuala Tahan for easy park access.'
        ],
        [
            'id' => 14, 
            'name' => 'Genting Highlands', 
            'country' => 'Malaysia', 
            'description' => 'Entertainment and casino resort in the clouds',
            'travel_tips' => 'Best time: Year-round (cool climate 15-25°C). Take Genting Skyway cable car for scenic views. Bring warm clothes for cool weather. Must-visit: Theme parks, casino (21+ with passport), Premium Outlets. Book hotel packages for better deals. Heavy traffic on weekends, travel on weekdays if possible.'
        ],
        [
            'id' => 15, 
            'name' => 'Putrajaya', 
            'country' => 'Malaysia', 
            'description' => 'Modern administrative capital with stunning architecture',
            'travel_tips' => 'Best time: Early morning or late afternoon to avoid heat. Must-see: Pink Mosque (Masjid Putra), Putrajaya Bridge, Millennium Monument. Take lake cruise for city views. Rent bicycle for eco-friendly exploration. Visit during weekends for vibrant atmosphere. Free entry to most attractions. Bring camera for Instagram-worthy shots.'
        ]
    ];
    
    $stmt = $db->prepare("INSERT INTO destinations (id, name, country, description, travel_tips) VALUES (?, ?, ?, ?, ?)");
    
    foreach ($destinations as $dest) {
        $stmt->execute([$dest['id'], $dest['name'], $dest['country'], $dest['description'], $dest['travel_tips']]);
        echo "Added: {$dest['name']}" . PHP_EOL;
    }
    
    // Update existing trips to use valid destination IDs (map invalid IDs to Kuala Lumpur)
    echo PHP_EOL . "Updating existing trips to use valid destination IDs..." . PHP_EOL;
    $db->exec("UPDATE trips SET destination_id = 1 WHERE destination_id > 15");
    
    // Re-enable foreign key checks
    $db->exec("SET FOREIGN_KEY_CHECKS = 1");
    
    echo PHP_EOL . "=== Successfully reset to 15 destinations ===" . PHP_EOL;
    
    // Show final count
    $stmt = $db->prepare("SELECT COUNT(*) as count FROM destinations");
    $stmt->execute();
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    echo "Total destinations now: {$result['count']}" . PHP_EOL;
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . PHP_EOL;
}
