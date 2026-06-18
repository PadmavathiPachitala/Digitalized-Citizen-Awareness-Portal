# Digitalized Citizen Awareness Portal (DCAP)

## Overview

Digitalized Citizen Awareness Portal (DCAP) is a centralized platform designed to help citizens easily discover government welfare schemes, understand eligibility criteria, access required documents, stay informed about public welfare updates, and receive AI-assisted guidance.

The portal aims to bridge the gap between citizens and government services by providing reliable information through a single digital platform.

---

## Problem Statement

Citizens often face difficulties in accessing government schemes and welfare benefits because information is scattered across multiple websites and portals.

Common challenges include:

- Lack of awareness about available schemes
- Difficulty understanding eligibility criteria
- Uncertainty regarding required documents
- Limited access to trustworthy information
- Growing cyber fraud and misinformation
- Complex government portals with poor user experience

As a result, many eligible beneficiaries fail to receive the support intended for them.

---

## Proposed Solution

DCAP provides a single platform where citizens can:

- Discover government schemes
- Check eligibility
- Access document requirements
- Learn about cyber safety
- Receive AI-powered guidance
- Stay updated on government announcements

The portal simplifies public service discovery and improves digital awareness.

---

## Key Features

### Government Schemes

- Student Schemes
- Farmer Schemes
- Public Welfare Schemes
- Detailed scheme information
- Search and filtering

### Eligibility Checker

- Citizen profile based recommendations
- Personalized scheme suggestions

### Documents Guide

- Required documents
- Application procedures
- Verification checklists

### AI Assistant

- Gemini-powered guidance
- Scheme-related assistance
- Document-related support

### Cyber Safety Awareness

- Scam awareness
- Online safety guidance
- Public cybersecurity education

### Government Updates

- Welfare announcements
- Public notices
- Awareness campaigns

### Feedback System

- Citizen suggestions
- User feedback collection

---

## System Architecture

User
↓
Frontend (HTML + CSS + JavaScript)
↓
Node.js + Express APIs
↓
Supabase Database
↓
Gemini AI Services

---

## Technology Stack

| Layer | Technology |
|---------|-------------|
| Frontend | HTML5 |
| Styling | CSS3 |
| Client Logic | Vanilla JavaScript |
| Backend | Node.js |
| Framework | Express.js |
| Database | Supabase |
| Database Engine | PostgreSQL |
| AI | Google Gemini |
| Hosting | Render |
| Version Control | Git & GitHub |

---

## Project Structure

Digitalized-Citizen-Awareness-Portal

├── assets/
├── css/
├── js/
├── pages/
│
├── server/
│ ├── config/
│ ├── middleware/
│ ├── routes/
│ ├── services/
│ └── utils/
│
├── supabase/
│
├── index.html
├── package.json
├── .env.example
└── README.md

---

## API Endpoints

### Schemes

GET /api/schemes

GET /api/schemes/:id

### Search

GET /api/search?q=

### Eligibility

POST /api/eligibility

### AI Assistant

POST /api/assistant

### Feedback

POST /api/feedback

### Updates

GET /api/updates

### Cyber Awareness

GET /api/scams

### Health Check

GET /api/health
