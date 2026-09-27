db.createCollection('post', {
   validator: {
      $jsonSchema: {
         bsonType: 'object',
         title: "Post Object Validation",
         required: ["title", "text", "tag", "description", "comments", "creator"],
         properties: {
            title: {
               bsonType: "string",
               description: "'title' must be a string and is required"
            },
            text: {
               bsonType: "string",
               description: "'text' must be a string and is required"
            },
            tag: {
               bsonType: "array",
               description: "'tag' must be a array and is required"
            },
            description: {
               bsonType: "string",
               description: "'description' must be a string and is required"
            },
            creator: {
               bsonType: "objectId",
               description: "'creator' must be a objectId and is required"
            },
            comments: {
               bsonType: "array",
               description: "'Comments' must be an array of Object and is required",
               items: {
                  bsonType: 'object',
                  title: "Comments Object Validation",
                  required: ["text", "author"],
                  properties: {
                     text: {
                        bsonType: "string",
                        description: "'text' must be a string and is required"
                     },
                     author: {
                        bsonType: "objectId",
                        description: "'author' must be a objectId and is required"
                     }
                  }
               }
            }
         }
      }
   }
})


db.createCollection('user', {
   validator: {
      $jsonSchema: {
         bsonType: 'object',
         title: "user Object Validation",
         required: ["firstName", "lastName", "username", "email", "birthdate"],
         properties: {
            firstName: {
               bsonType: "string",
               pattern: '^[a-zA-Z]+$',
               description: "'firstname' must be a alphabetic string and is required"
            },
            middlename: {
               bsonType: "string",
               pattern: '^[a-zA-Z]+$',
               description: "'middlename' must be an alphabetic string if provided"
            },
            lastName: {
               bsonType: "string",
               pattern: '^[a-zA-Z]+$',
               description: "'lastName' must be a alphabetic string and is required"
            },
            username: {
               bsonType: "string",
               pattern: '^[a-zA-Z]+$',
               description: "'username' must be a alphabetic string and is required"
            },
            email: {
               bsonType: "string",
               pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$',
               description: "'email' must be a valid email and is required"
            },
            birthdate: {
               bsonType: "date",
               description: "'birthdate' must be a valid date and is required"
            }
         }
      }
   }
})





const dummyUsers = [
   {
      firstName: "Alice",
      lastName: "Smith",
      username: "AliceSmith",
      email: "alice.smith@example.com",
      birthdate: new Date("1985-05-15T00:00:00Z")
   },
   {
      firstName: "Bob",
      middlename: "Charles",
      lastName: "Brown",
      username: "BobBrown",
      email: "bob.brown@example.com",
      birthdate: new Date("1978-10-10T00:00:00Z")
   },
   {
      firstName: "Emily",
      middlename: "Grace",
      lastName: "Davis",
      username: "EmilyDavis",
      email: "emily.davis@example.com",
      birthdate: new Date("1992-07-20T00:00:00Z")
   },
   {
      firstName: "Michael",
      lastName: "Johnson",
      username: "MichaelJ",
      email: "michael.johnson@example.com",
      birthdate: new Date("1980-03-25T00:00:00Z")
   },
   {
      firstName: "Sarah",
      middlename: "Rose",
      lastName: "Williams",
      username: "SarahW",
      email: "sarah.williams@example.com",
      birthdate: new Date("1995-11-30T00:00:00Z")
   },
   {
      firstName: "David",
      lastName: "Jones",
      username: "DavidJones",
      email: "david.jones@example.com",
      birthdate: new Date("1988-09-05T00:00:00Z")
   },
   {
      firstName: "Laura",
      middlename: "Marie",
      lastName: "Miller",
      username: "LauraMiller",
      email: "laura.miller@example.com",
      birthdate: new Date("1993-12-12T00:00:00Z")
   },
   {
      firstName: "Kevin",
      lastName: "Wilson",
      username: "KevinWilson",
      email: "kevin.wilson@example.com",
      birthdate: new Date("1975-06-15T00:00:00Z")
   },
   {
      firstName: "Olivia",
      middlename: "Jane",
      lastName: "Taylor",
      username: "OliviaTaylor",
      email: "olivia.taylor@example.com",
      birthdate: new Date("1982-04-22T00:00:00Z")
   }
];

db.user.insertOne({
   firstName: "Amit",
   lastName: "Majumdar",
   username: "aMjumdar",
   email: "amit.pal@example.com",
   birthdate: new Date("1985-05-15T00:00:00Z"),
   ss: "dwdwdwd"
})

const postData = [
   {
      title: "Introduction to MongoDB",
      text: "MongoDB is a powerful document-oriented database. This post explains its basics and why it's great for scalability and performance.",
      tag: ["mongodb", "nosql", "database"],
      description: "A beginner's guide to understanding MongoDB.",
      creator: ObjectId("67b9ff3e6952435d8cfa4218"),
      comments: [
         {
            text: "Great introduction, very clear!",
            author: ObjectId("67b9fdc96952435d8cfa4214")
         },
         {
            text: "Thanks for the insights. Looking forward to more posts like this.",
            author: ObjectId("67b9ffa16952435d8cfa421a")
         }
      ]
   },
   {
      title: "Exploring Node.js",
      text: "An introduction to Node.js, its event-driven architecture, and how it benefits web development.",
      tag: ["nodejs", "javascript", "backend"],
      description: "A beginner's guide to Node.js and asynchronous programming.",
      creator: ObjectId("67b9ffa16952435d8cfa421a"),
      comments: [
         {
            text: "Very informative post on Node.js.",
            author: ObjectId("67b9fdc96952435d8cfa4214")
         }
      ]
   },
   {
      title: "Understanding REST APIs",
      text: "This article covers the basics of RESTful APIs and how they are used to connect different systems.",
      tag: ["REST", "API", "web"],
      description: "Learn how REST APIs work and why they are essential for modern web development.",
      creator: ObjectId("67b9ffa16952435d8cfa421b"),
      comments: [
         {
            text: "Great explanation on APIs.",
            author: ObjectId("67b9ffa16952435d8cfa421c")
         }
      ]
   },
   {
      title: "CSS Grid vs Flexbox",
      text: "A comparative study on CSS Grid and Flexbox layouts, discussing when to use each technique.",
      tag: ["css", "webdesign", "frontend"],
      description: "An in-depth comparison between CSS Grid and Flexbox.",
      creator: ObjectId("67b9ffa16952435d8cfa421c"),
      comments: [
         {
            text: "This helped me decide which layout to use.",
            author: ObjectId("67b9ffa16952435d8cfa421d")
         }
      ]
   },
   {
      title: "Getting Started with React",
      text: "React is a popular JavaScript library for building user interfaces. This post covers the basics of setting up a React project.",
      tag: ["react", "javascript", "frontend"],
      description: "Introduction to building applications with React.",
      creator: ObjectId("67b9ffa16952435d8cfa421d"),
      comments: [
         {
            text: "Very helpful for beginners!",
            author: ObjectId("67b9ffa16952435d8cfa421e")
         }
      ]
   },
   {
      title: "Mastering Python for Data Science",
      text: "Python is a versatile language, and this post explains its applications in data science including libraries like Pandas and NumPy.",
      tag: ["python", "datascience", "programming"],
      description: "A comprehensive guide to Python's role in data science.",
      creator: ObjectId("67b9ffa16952435d8cfa421e"),
      comments: [
         {
            text: "Python is my go-to language for data analysis.",
            author: ObjectId("67b9ffa16952435d8cfa421f")
         }
      ]
   },
   {
      title: "Introduction to Machine Learning",
      text: "Machine learning is transforming industries. This post provides an overview of key concepts and algorithms in machine learning.",
      tag: ["machine learning", "AI", "datascience"],
      description: "A beginner's look at machine learning techniques and applications.",
      creator: ObjectId("67b9ffa16952435d8cfa421f"),
      comments: [
         {
            text: "Can you include more examples in future posts?",
            author: ObjectId("67b9ffa16952435d8cfa4220")
         }
      ]
   },
   {
      title: "Effective Git Workflow",
      text: "Version control is essential for collaborative development. This post explains best practices for using Git in a team.",
      tag: ["git", "version control", "development"],
      description: "Tips and tricks for managing code changes with Git.",
      creator: ObjectId("67b9ffa16952435d8cfa4220"),
      comments: [
         {
            text: "These Git tips saved my project!",
            author: ObjectId("67b9ffa16952435d8cfa4221")
         }
      ]
   },
   {
      title: "Docker Basics for Developers",
      text: "Docker simplifies application deployment by containerizing environments. Learn how to use Docker for development.",
      tag: ["docker", "devops", "containers"],
      description: "An introduction to containerization with Docker.",
      creator: ObjectId("67b9ffa16952435d8cfa4221"),
      comments: [
         {
            text: "Docker has revolutionized our deployment process.",
            author: ObjectId("67b9ffa16952435d8cfa4222")
         }
      ]
   },
   {
      title: "Cybersecurity Essentials",
      text: "This post discusses basic cybersecurity measures every developer should be aware of to protect applications.",
      tag: ["cybersecurity", "infosec", "technology"],
      description: "A guide to understanding and implementing cybersecurity best practices.",
      creator: ObjectId("67b9ffa16952435d8cfa4222"),
      comments: [
         {
            text: "An important read in today's digital age.",
            author: ObjectId("67b9fdc96952435d8cfa4214")
         }
      ]
   },
   {
      title: "GraphQL vs REST",
      text: "GraphQL is an alternative to REST. This article compares the two, discussing their pros and cons for API design.",
      tag: ["graphql", "rest", "api"],
      description: "A comparative analysis of GraphQL and REST API architectures.",
      creator: ObjectId("67b9fdc96952435d8cfa4214"),
      comments: [
         {
            text: "I appreciate the clear comparison between the two approaches.",
            author: ObjectId("67b9ff3e6952435d8cfa4218")
         }
      ]
   }
]

db.movies.find({ $or: [{ 'rating.average': { $lt: 5 } }, { 'rating.average': { $gt: 9.3 } }] }, { rating: 1, name: 1, runtime: 1 })