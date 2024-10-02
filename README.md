# Video Streaming Backend

This repository contains the backend for a video streaming platform. The platform allows users to upload, stream, like, and comment on videos, create playlists, and manage subscriptions. Built with Node.js, Express, and MongoDB.

## Features
- User authentication (sign up, login)
- Upload and stream videos
- Create playlists
- Like and comment on videos
- Subscribe to users and manage subscriptions
- View and interact with tweets

## Tech Stack
- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose
- **File Storage**: CLOUDINARY
- **Authentication**: JWT (JSON Web Tokens)


## Installation

1. Clone the repository:
    ```bash
    git clone https://github.com/username/repository-name.git
    cd repository-name
    ```

2. Install dependencies:
    ```bash
    npm install
    ```

3. Set up environment variables by creating a `.env` file in the root directory:
    ```bash
   PORT = 8000
    MONGODB_URI =
    CORS_ORIGIN =
    ACCESS_TOKEN_SECRET = 
    ACCESS_TOKEN_EXPIRY = 
    REFRESH_TOKEN_SECRET=
    REFRESH_TOKEN_EXPIRY=
    CLOUDINARY_CLOUD_NAME=
    CLOUDINARY_API_KEY =
    CLOUDINARY_API_SECRET =



    ```

4. Start the server:
    ```bash
    npm run start
    ```


## License
This project is licensed under the MIT License.
