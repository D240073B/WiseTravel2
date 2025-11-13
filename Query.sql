
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
                travel_tips TEXT,
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
                user_id INT NOT NULL,
                role ENUM('owner', 'participant') DEFAULT 'participant',
                joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                UNIQUE KEY unique_trip_user (trip_id, user_id)
            );
       
            -- Create feedback table
            CREATE TABLE IF NOT EXISTS feedback (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                feedback_type ENUM('suggestion', 'question', 'problem') NOT NULL,
                subject VARCHAR(255) NOT NULL,
                message TEXT NOT NULL,
                status ENUM('pending', 'reviewed', 'resolved') DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );
