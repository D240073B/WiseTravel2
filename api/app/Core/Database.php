<?php

namespace App\Core;

use PDO;
use PDOException;

class Database
{
    private static $instance = null;
    private $connection;

    private function __construct()
    {
        $host = $_ENV['DB_HOST'] ?? 'localhost';
        $dbname = $_ENV['DB_NAME'] ?? 'wisetravel2';
        $username = $_ENV['DB_USER'] ?? 'root';
        $password = $_ENV['DB_PASS'] ?? '';
        $port = $_ENV['DB_PORT'] ?? '3306';

        try {
            $dsn = "mysql:host={$host};port={$port};dbname={$dbname};charset=utf8mb4";
            $this->connection = new PDO($dsn, $username, $password, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
                PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4"
            ]);
        } catch (PDOException $e) {
            throw new \Exception("Database connection failed: " . $e->getMessage());
        }
    }

    public static function getInstance(): self
    {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    public function getConnection(): PDO
    {
        return $this->connection;
    }

    public function createTables(): void
    {
        $sql = "
            -- Create users table
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                preferred_currency VARCHAR(3) DEFAULT 'MYR',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            );

            -- Create destinations table
            CREATE TABLE IF NOT EXISTS destinations (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                country VARCHAR(255) NOT NULL DEFAULT 'Malaysia',
                description TEXT,
                image_url VARCHAR(500),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            -- Create expense_categories table
            CREATE TABLE IF NOT EXISTS expense_categories (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                icon VARCHAR(50),
                color VARCHAR(7) DEFAULT '#007bff',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            -- Create trips table
            CREATE TABLE IF NOT EXISTS trips (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                name VARCHAR(255) NOT NULL,
                destination_id INT NOT NULL,
                start_date DATE NOT NULL,
                end_date DATE NOT NULL,
                budget DECIMAL(10,2) DEFAULT 0.00,
                currency VARCHAR(3) DEFAULT 'MYR',
                description TEXT,
                status ENUM('planning', 'active', 'completed', 'cancelled') DEFAULT 'planning',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (destination_id) REFERENCES destinations(id)
            );

            -- Create expenses table
            CREATE TABLE IF NOT EXISTS expenses (
                id INT AUTO_INCREMENT PRIMARY KEY,
                trip_id INT NOT NULL,
                user_id INT NOT NULL,
                category_id INT NOT NULL,
                description VARCHAR(255) NOT NULL,
                amount DECIMAL(10,2) NOT NULL,
                currency VARCHAR(3) DEFAULT 'MYR',
                paid_by INT NOT NULL,
                expense_date DATE NOT NULL,
                receipt_url VARCHAR(500),
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (category_id) REFERENCES expense_categories(id),
                FOREIGN KEY (paid_by) REFERENCES users(id)
            );

            -- Create trip_participants table
            CREATE TABLE IF NOT EXISTS trip_participants (
                id INT AUTO_INCREMENT PRIMARY KEY,
                trip_id INT NOT NULL,
                user_id INT NULL,
                participant_name VARCHAR(255) NOT NULL,
                role ENUM('owner', 'participant') DEFAULT 'participant',
                joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                UNIQUE KEY unique_trip_user (trip_id, user_id),
                UNIQUE KEY unique_trip_name (trip_id, participant_name)
            );
        ";

        $statements = explode(';', $sql);
        foreach ($statements as $statement) {
            $statement = trim($statement);
            if (!empty($statement)) {
                $this->connection->exec($statement);
            }
        }
        
        // Migrate existing data if needed
        $this->migrateParticipantData();
    }
    
    private function migrateParticipantData(): void
    {
        try {
            // Check if participant_name column exists
            $stmt = $this->connection->prepare("SHOW COLUMNS FROM trip_participants LIKE 'participant_name'");
            $stmt->execute();
            $columnExists = $stmt->fetch();
            
            if (!$columnExists) {
                // Add the column if it doesn't exist
                $this->connection->exec("ALTER TABLE trip_participants ADD COLUMN participant_name VARCHAR(255) NOT NULL DEFAULT ''");
                
                // Update existing records to populate participant_name from users table
                $this->connection->exec("
                    UPDATE trip_participants tp 
                    JOIN users u ON tp.user_id = u.id 
                    SET tp.participant_name = u.name 
                    WHERE tp.participant_name = '' OR tp.participant_name IS NULL
                ");
                
                // Remove the unique constraint and recreate it properly
                $this->connection->exec("ALTER TABLE trip_participants DROP INDEX IF EXISTS unique_trip_user");
                $this->connection->exec("ALTER TABLE trip_participants ADD UNIQUE KEY unique_trip_user (trip_id, user_id)");
                $this->connection->exec("ALTER TABLE trip_participants ADD UNIQUE KEY unique_trip_name (trip_id, participant_name)");
            }
        } catch (\Exception $e) {
            // Migration failed, but continue - the table structure might already be correct
            error_log("Participant migration failed: " . $e->getMessage());
        }
    }

    public function seedInitialData(): void
    {
        // Check if data already exists
        $stmt = $this->connection->query("SELECT COUNT(*) FROM destinations");
        if ($stmt->fetchColumn() > 0) {
            return; // Data already seeded
        }

        // Insert destinations
        $destinations = [
            // Major Cities
            ['Kuala Lumpur', 'Malaysia', 'The vibrant capital city with iconic twin towers', '/img/kl.jpg'],
            ['George Town, Penang', 'Malaysia', 'UNESCO World Heritage city with rich culture and street food', '/img/penang.jpg'],
            ['Johor Bahru', 'Malaysia', 'Gateway city to Singapore with modern attractions', '/img/jb.jpg'],
            ['Ipoh', 'Malaysia', 'Charming city known for white coffee and limestone caves', '/img/ipoh.jpg'],
            ['Kota Kinabalu', 'Malaysia', 'Capital of Sabah with stunning sunsets and Mount Kinabalu', '/img/kk.jpg'],
            ['Kuching', 'Malaysia', 'Cat city of Sarawak with cultural heritage and nature', '/img/kuching.jpg'],
            ['Melaka', 'Malaysia', 'Historic city with Dutch colonial architecture', '/img/malacca.jpg'],
            ['Shah Alam', 'Malaysia', 'Modern planned city with the Blue Mosque', '/img/shah-alam.jpg'],
            ['Alor Setar', 'Malaysia', 'Northern city with rice fields and traditional culture', '/img/alor-setar.jpg'],
            ['Kuantan', 'Malaysia', 'Capital of Pahang with beautiful beaches nearby', '/img/kuantan.jpg'],
            
            // Islands & Beaches
            ['Langkawi', 'Malaysia', 'Legendary island with pristine beaches and duty-free shopping', '/img/langkawi.jpg'],
            ['Tioman Island', 'Malaysia', 'Crystal clear waters perfect for diving and snorkeling', '/img/tioman.jpg'],
            ['Redang Island', 'Malaysia', 'Marine park with white sandy beaches', '/img/redang.jpg'],
            ['Perhentian Islands', 'Malaysia', 'Twin islands with backpacker-friendly vibes', '/img/perhentian.jpg'],
            ['Pangkor Island', 'Malaysia', 'Peaceful island getaway with fishing villages', '/img/pangkor.jpg'],
            ['Sipadan Island', 'Malaysia', 'World-renowned diving destination in Sabah', '/img/sipadan.jpg'],
            ['Mabul Island', 'Malaysia', 'Macro diving paradise near Sipadan', '/img/mabul.jpg'],
            ['Kapas Island', 'Malaysia', 'Small island with clear waters and coral reefs', '/img/kapas.jpg'],
            ['Rawa Island', 'Malaysia', 'Secluded island with white sand beaches', '/img/rawa.jpg'],
            ['Tenggol Island', 'Malaysia', 'Hidden gem for diving enthusiasts', '/img/tenggol.jpg'],
            
            // Hill Stations
            ['Cameron Highlands', 'Malaysia', 'Cool climate hill station with tea plantations and strawberry farms', '/img/cameron.jpg'],
            ['Genting Highlands', 'Malaysia', 'Entertainment resort high in the mountains', '/img/genting.jpg'],
            ['Fraser\'s Hill', 'Malaysia', 'Tranquil hill resort with colonial charm', '/img/frasers.jpg'],
            ['Bukit Tinggi', 'Malaysia', 'French-themed resort with cool weather', '/img/bukit-tinggi.jpg'],
            ['Maxwell Hill (Bukit Larut)', 'Malaysia', 'Oldest hill resort in Malaysia', '/img/maxwell.jpg'],
            ['Kundasang', 'Malaysia', 'Mountain town near Mount Kinabalu with vegetable farms', '/img/kundasang.jpg'],
            
            // National Parks & Nature
            ['Taman Negara', 'Malaysia', 'Ancient rainforest with canopy walkways and wildlife', '/img/taman-negara.jpg'],
            ['Kinabalu Park', 'Malaysia', 'UNESCO World Heritage site with Mount Kinabalu', '/img/kinabalu-park.jpg'],
            ['Gunung Mulu National Park', 'Malaysia', 'Famous for its limestone caves and formations', '/img/mulu.jpg'],
            ['Bako National Park', 'Malaysia', 'Sarawak\'s oldest park with diverse ecosystems', '/img/bako.jpg'],
            ['Endau-Rompin National Park', 'Malaysia', 'Pristine rainforest spanning Johor and Pahang', '/img/endau-rompin.jpg'],
            ['Royal Belum State Park', 'Malaysia', 'One of the world\'s oldest rainforests', '/img/belum.jpg'],
            ['Sepilok', 'Malaysia', 'Orangutan rehabilitation centre in Sabah', '/img/sepilok.jpg'],
            ['Danum Valley', 'Malaysia', 'Primary rainforest conservation area', '/img/danum.jpg'],
            
            // Cultural & Historical Sites
            ['Putrajaya', 'Malaysia', 'Planned federal administrative capital with modern architecture', '/img/putrajaya.jpg'],
            ['Kota Bharu', 'Malaysia', 'Cultural heart of Kelantan with traditional crafts', '/img/kota-bharu.jpg'],
            ['Kuala Terengganu', 'Malaysia', 'Capital of Terengganu with Islamic heritage', '/img/kuala-terengganu.jpg'],
            ['Taiping', 'Malaysia', 'Historic town with the first railway and zoo in Malaysia', '/img/taiping.jpg'],
            ['Kuala Kangsar', 'Malaysia', 'Royal town of Perak with palaces and mosques', '/img/kuala-kangsar.jpg'],
            ['Seri Menanti', 'Malaysia', 'Royal capital of Negeri Sembilan with traditional architecture', '/img/seri-menanti.jpg'],
            
            // Adventure & Eco-Tourism
            ['Tawau', 'Malaysia', 'Gateway to Sipadan diving and cocoa plantations', '/img/tawau.jpg'],
            ['Sandakan', 'Malaysia', 'Nature city with orangutan sanctuary and proboscis monkeys', '/img/sandakan.jpg'],
            ['Lahad Datu', 'Malaysia', 'Eastern Sabah town near Danum Valley', '/img/lahad-datu.jpg'],
            ['Semporna', 'Malaysia', 'Diving capital with access to world-class dive sites', '/img/semporna.jpg'],
            ['Miri', 'Malaysia', 'Oil town and gateway to Gunung Mulu National Park', '/img/miri.jpg'],
            ['Sibu', 'Malaysia', 'River town known as the gateway to the heart of Sarawak', '/img/sibu.jpg'],
            ['Kapit', 'Malaysia', 'Upriver town accessible only by boat', '/img/kapit.jpg'],
            
            // Beach Towns & Coastal Areas
            ['Port Dickson', 'Malaysia', 'Popular beach destination near Kuala Lumpur', '/img/port-dickson.jpg'],
            ['Desaru', 'Malaysia', 'Beach resort area in Johor with golf courses', '/img/desaru.jpg'],
            ['Cherating', 'Malaysia', 'Laid-back beach town popular with backpackers', '/img/cherating.jpg'],
            ['Pantai Cenang', 'Malaysia', 'Main beach area in Langkawi with resorts and activities', '/img/pantai-cenang.jpg'],
            ['Batu Ferringhi', 'Malaysia', 'Beach resort area in Penang with water sports', '/img/batu-ferringhi.jpg'],
            ['Teluk Intan', 'Malaysia', 'Town famous for its leaning clock tower', '/img/teluk-intan.jpg'],
            
            // Unique Destinations
            ['Gua Tempurung', 'Malaysia', 'One of the longest caves in Peninsula Malaysia', '/img/gua-tempurung.jpg'],
            ['Kellie\'s Castle', 'Malaysia', 'Unfinished mansion with mysterious history', '/img/kellies-castle.jpg'],
            ['A Famosa', 'Malaysia', 'Historic Portuguese fortress ruins in Melaka', '/img/a-famosa.jpg'],
            ['Batu Caves', 'Malaysia', 'Hindu temple complex in limestone caves', '/img/batu-caves.jpg'],
            ['Sekinchan', 'Malaysia', 'Rice farming town with beautiful paddy fields', '/img/sekinchan.jpg'],
            ['Kuala Selangor', 'Malaysia', 'Firefly watching and historical fort', '/img/kuala-selangor.jpg']
        ];

        $stmt = $this->connection->prepare("INSERT INTO destinations (name, country, description, image_url) VALUES (?, ?, ?, ?)");
        foreach ($destinations as $dest) {
            $stmt->execute($dest);
        }

        // Insert expense categories
        $categories = [
            ['Food & Dining', '🍽️', '#FF6B6B'],
            ['Transportation', '🚗', '#4ECDC4'],
            ['Accommodation', '🏨', '#45B7D1'],
            ['Activities', '🎯', '#96CEB4'],
            ['Shopping', '🛍️', '#FFEAA7'],
            ['Entertainment', '🎪', '#DDA0DD'],
            ['Health & Medical', '🏥', '#FF7675'],
            ['Miscellaneous', '📋', '#74B9FF']
        ];

        $stmt = $this->connection->prepare("INSERT INTO expense_categories (name, icon, color) VALUES (?, ?, ?)");
        foreach ($categories as $category) {
            $stmt->execute($category);
        }

        // Insert test user
        $passwordHash = password_hash('password123', PASSWORD_DEFAULT);
        $stmt = $this->connection->prepare("INSERT INTO users (name, email, password, preferred_currency) VALUES (?, ?, ?, ?)");
        $stmt->execute(['Test User', 'test@wisetravel.com', $passwordHash, 'MYR']);
    }
}
