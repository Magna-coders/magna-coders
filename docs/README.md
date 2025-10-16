# Magna Coders Documentation

This directory contains comprehensive documentation for the magna-coders project.

## Contents
- API documentation
- Architecture diagrams
- Development guides
- Deployment instructions
- Contributing guidelines

## Project Overview
Magna Coders is a full-stack web application built with modern technologies:

### Frontend
- **Framework**: Next.js 14 with React 18
- **Language**: TypeScript
- **Styling**: CSS Modules / Styled Components
- **State Management**: Redux Toolkit / Zustand

### Backend
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT
- **Security**: Helmet, CORS

### Infrastructure
- **Containerization**: Docker & Docker Compose
- **Database**: PostgreSQL 15
- **Development**: Hot reload for both frontend and backend

## Getting Started
1. Clone the repository
2. Follow setup instructions in the root README.md
3. Use Docker Compose for easy development environment setup

## Architecture
```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Frontend  │    │   Backend   │    │  Database   │
│  (Next.js)  │◄──►│ (Express)   │◄──►│(PostgreSQL) │
│   Port 3000 │    │  Port 5000  │    │  Port 5432  │
└─────────────┘    └─────────────┘    └─────────────┘
```