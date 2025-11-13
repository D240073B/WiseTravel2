# WiseTravel2 - Entity Relationship Diagram

## Database Schema

```plantuml
@startuml WiseTravel_ERD

' Entities
entity "users" as users {
  * id(PK) : int
  --
  name : varchar
  email : varchar
  password : varchar
  preferred_currency : varchar
  created_at : timestamp
  updated_at : timestamp
}

entity "destinations" as destinations {
  * id(PK) : int
  --
  name : varchar
  country : varchar
  description : text
  travel_tips : text
  image_url : varchar
  created_at : timestamp
}

entity "trips" as trips {
  * id(PK) : int
  --
  userID : int
  name : varchar
  destination_id : int
  start_date : date
  end_date : date
  budget : decimal
  currency : varchar
  description : text
  status : enum
  created_at : timestamp
  updated_at : timestamp
}

entity "expenses" as expenses {
  * id(PK) : int
  --
  trip_id : int
  user_id : int
  category_id : int
  description : varchar
  amount : decimal
  currency : varchar
  paid_by : int
  expense_date : date
  receipt_url : varchar
  notes : text
  created_at : timestamp
  updated_at : timestamp
}

entity "expense_categories" as expense_categories {
  * id(PK) : int
  --
  name : varchar
  icon : varchar
  color : varchar
  created_at : timestamp
}

entity "trip_participants" as trip_participants {
  * id(PK) : int
  --
  trip_id : int
  user_id : int
  role : enum
  joined_at : timestamp
}

entity "feedback" as feedback {
  * id(PK) : int
  --
  user_id : int
  feedback_type : enum
  subject : varchar
  message : text
  status : enum
  created_at : timestamp
  updated_at : timestamp
}

' Relationships
users "1" -- "0..*" trips : has
users "1" -- "0..*" expenses : has
users "1" -- "0..*" trip_participants : has
users "1" -- "0..*" feedback : has

destinations "1" -- "0..*" trips : has

trips "1" -- "0..*" expenses : has
trips "1" -- "0..*" trip_participants : has

expense_categories "1" -- "0..*" expenses : has

@enduml
```

## Alternative Format (Mermaid for GitHub/VS Code)

```mermaid
erDiagram
    users ||--o{ trips : has
    users ||--o{ expenses : has
    users ||--o{ trip_participants : has
    users ||--o{ feedback : has
    
    destinations ||--o{ trips : has
    
    trips ||--o{ expenses : has
    trips ||--o{ trip_participants : has
    
    expense_categories ||--o{ expenses : has
    
    users {
        int id PK
        varchar name
        varchar email
        varchar password
        varchar preferred_currency
        timestamp created_at
        timestamp updated_at
    }
    
    destinations {
        int id PK
        varchar name
        varchar country
        text description
        text travel_tips
        varchar image_url
        timestamp created_at
    }
    
    expense_categories {
        int id PK
        varchar name
        varchar icon
        varchar color
        timestamp created_at
    }
    
    trips {
        int id PK
        int userID
        varchar name
        int destination_id
        date start_date
        date end_date
        decimal budget
        varchar currency
        text description
        enum status
        timestamp created_at
        timestamp updated_at
    }
    
    expenses {
        int id PK
        int trip_id
        int user_id
        int category_id
        varchar description
        decimal amount
        varchar currency
        int paid_by
        date expense_date
        varchar receipt_url
        text notes
        timestamp created_at
        timestamp updated_at
    }
    
    trip_participants {
        int id PK
        int trip_id
        int user_id
        enum role
        timestamp joined_at
    }
    
    feedback {
        int id PK
        int user_id
        enum feedback_type
        varchar subject
        text message
        enum status
        timestamp created_at
        timestamp updated_at
    }
```

## Relationships Explained

### 1:N (One-to-Many) Relationships

- **users → trips**: One user can have many trips
- **users → expenses**: One user can create many expenses
- **users → trip_participants**: One user can participate in many trips
- **users → feedback**: One user can submit many feedback entries
- **destinations → trips**: One destination can be used in many trips
- **trips → expenses**: One trip can have many expenses
- **trips → trip_participants**: One trip can have many participants
- **expense_categories → expenses**: One category can be used in many expenses

## Table Descriptions

### users
Main user accounts with authentication and preferences.

### destinations
Popular travel destinations with descriptions and tips.

### trips
Travel trips planned or completed by users.

### expenses
Individual expenses tracked for each trip.

### expense_categories
Predefined categories for classifying expenses (food, transport, accommodation, etc.).

### trip_participants
Junction table linking users to trips they participate in (with roles: owner/participant).

### feedback
User feedback submissions (suggestions, questions, problems).

---

## Class Diagram (UML Style)

```plantuml
@startuml WiseTravel_ClassDiagram

skinparam classAttributeFontSize 16
skinparam classFontSize 18
skinparam defaultFontSize 16
skinparam arrowFontSize 16
skinparam stereotypeFontSize 16

class users {
  - id : int
  - name : varchar
  - email : varchar
  - password : varchar
  - preferred_currency : varchar
  - created_at : timestamp
  - updated_at : timestamp
  __
  + findByEmail(email : string) : array
  + create(data : array) : int
  + verifyPassword(password : string, hashedPassword : string) : bool
  + updatePassword(id : int, newPassword : string) : bool
  + getTrips(userId : int) : array
  + getTotalExpenses(userId : int) : float
  + getStats(userId : int) : array
}

class destinations {
  - id : int
  - name : varchar
  - country : varchar
  - description : text
  - travel_tips : text
  - image_url : varchar
  - created_at : timestamp
  __
  + getPopularDestinations(limit : int) : array
  + searchDestinations(query : string) : array
  + getDestinationStats(destinationId : int) : array
}

class trips {
  - id : int
  - user_id : int
  - name : varchar
  - destination_id : int
  - start_date : date
  - end_date : date
  - budget : decimal
  - currency : varchar
  - description : text
  - status : enum
  - created_at : timestamp
  - updated_at : timestamp
  __
  + findWithDestination(id : int) : array
  + getUserTrips(userId : int) : array
  + getExpenses(tripId : int) : array
  + getTotalExpenses(tripId : int) : float
  + getExpensesByCategory(tripId : int) : array
  + getCashFlowData(tripId : int) : array
}

class expenses {
  - id : int
  - trip_id : int
  - user_id : int
  - category_id : int
  - description : varchar
  - amount : decimal
  - currency : varchar
  - paid_by : int
  - expense_date : date
  - receipt_url : varchar
  - notes : text
  - created_at : timestamp
  - updated_at : timestamp
  __
  + findWithDetails(id : int) : array
  + getTripExpenses(tripId : int) : array
  + getExpensesByDateRange(tripId : int, startDate : string, endDate : string) : array
  + getExpensesByCategory(tripId : int, categoryId : int) : array
  + getUserExpenses(userId : int, tripId : int) : array
}

class expense_categories {
  - id : int
  - name : varchar
  - icon : varchar
  - color : varchar
  - created_at : timestamp
  __
  + getWithExpenseCount(tripId : int) : array
  + getMostUsedCategories(limit : int) : array
}

class trip_participants {
  - id : int
  - trip_id : int
  - user_id : int
  - role : enum
  - joined_at : timestamp
  __
  + addParticipant(tripId : int, userId : int, role : string) : int
  + removeParticipant(tripId : int, userId : int) : bool
  + getParticipants(tripId : int) : array
}

class feedback {
  - id : int
  - user_id : int
  - feedback_type : enum
  - subject : varchar
  - message : text
  - status : enum
  - created_at : timestamp
  - updated_at : timestamp
  __
  + getUserFeedback(userId : int) : array
  + findWithDetails(id : int) : array
  + create(data : array) : int
  + updateStatus(id : int, status : string) : bool
  + getCountByType(userId : int) : array
}

users "1" -- "0..*" trips : owns
users "1" -- "0..*" expenses : creates
users "1" -- "0..*" trip_participants : has
users "1" -- "0..*" feedback : submits

destinations "1" -- "0..*" trips : has

trips "1" -- "0..*" expenses : has
trips "1" -- "0..*" trip_participants : has

expense_categories "1" -- "0..*" expenses : categorizes

@enduml
```

## Alternative: Mermaid Class Diagram (Larger Font)

```mermaid
classDiagram
    class users {
        -int id
        -varchar name
        -varchar email
        -varchar password
        -varchar preferred_currency
        -timestamp created_at
        -timestamp updated_at
        +findByEmail(email) array
        +create(data) int
        +verifyPassword(password, hashedPassword) bool
        +updatePassword(id, newPassword) bool
        +getTrips(userId) array
        +getTotalExpenses(userId) float
        +getStats(userId) array
    }
    
    class destinations {
        -int id
        -varchar name
        -varchar country
        -text description
        -text travel_tips
        -varchar image_url
        -timestamp created_at
        +getPopularDestinations(limit) array
        +searchDestinations(query) array
        +getDestinationStats(destinationId) array
    }
    
    class trips {
        -int id
        -int user_id
        -varchar name
        -int destination_id
        -date start_date
        -date end_date
        -decimal budget
        -varchar currency
        -text description
        -enum status
        -timestamp created_at
        -timestamp updated_at
        +findWithDestination(id) array
        +getUserTrips(userId) array
        +getExpenses(tripId) array
        +getTotalExpenses(tripId) float
        +getExpensesByCategory(tripId) array
        +getCashFlowData(tripId) array
    }
    
    class expenses {
        -int id
        -int trip_id
        -int user_id
        -int category_id
        -varchar description
        -decimal amount
        -varchar currency
        -int paid_by
        -date expense_date
        -varchar receipt_url
        -text notes
        -timestamp created_at
        -timestamp updated_at
        +findWithDetails(id) array
        +getTripExpenses(tripId) array
        +getExpensesByDateRange(tripId, startDate, endDate) array
        +getExpensesByCategory(tripId, categoryId) array
        +getUserExpenses(userId, tripId) array
    }
    
    class expense_categories {
        -int id
        -varchar name
        -varchar icon
        -varchar color
        -timestamp created_at
        +getWithExpenseCount(tripId) array
        +getMostUsedCategories(limit) array
    }
    
    class trip_participants {
        -int id
        -int trip_id
        -int user_id
        -enum role
        -timestamp joined_at
        +addParticipant(tripId, userId, role) int
        +removeParticipant(tripId, userId) bool
        +getParticipants(tripId) array
    }
    
    class feedback {
        -int id
        -int user_id
        -enum feedback_type
        -varchar subject
        -text message
        -enum status
        -timestamp created_at
        -timestamp updated_at
        +getUserFeedback(userId) array
        +findWithDetails(id) array
        +create(data) int
        +updateStatus(id, status) bool
        +getCountByType(userId) array
    }
    
    users "1" -- "0..*" trips : owns
    users "1" -- "0..*" expenses : creates
    users "1" -- "0..*" trip_participants : has
    users "1" -- "0..*" feedback : submits
    
    destinations "1" -- "0..*" trips : has
    
    trips "1" -- "0..*" expenses : has
    trips "1" -- "0..*" trip_participants : has
    
    expense_categories "1" -- "0..*" expenses : categorizes
```

---

## How to View

### For PlantUML:
1. Install PlantUML extension in VS Code
2. Or paste the PlantUML code into [PlantUML Online Editor](http://www.plantuml.com/plantuml/uml/)

### For Mermaid:
1. Install "Markdown Preview Mermaid Support" extension in VS Code
2. Or view on GitHub (renders automatically)
3. Or paste into [Mermaid Live Editor](https://mermaid.live)
