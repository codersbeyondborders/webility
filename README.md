# Websibility – Web Accessibility Remediation Tool

This is a full-stack application built with AWS Amplify to automatically audit and fix accessibility issues on web pages.

## 🔧 Features

- ✅ Enter a public website URL
- 🔍 Audit accessibility issues using `axe-core`
- 🛠️ Fix common issues (missing `alt`, semantic headings, roles)
- 🧠 Use Amazon Rekognition to auto-generate alt text for images
- ☁️ Store fixed HTML in S3 and provide a public URL for preview/download

---

## 🧱 Stack

- **Frontend**: React + Amplify Hosting
- **Backend**: Amplify Functions (Lambda), API Gateway (REST)
- **Tools**: `cheerio`, `axios`, `uuid`, `aws-sdk`, `rekognition`, `axe-core`
- **Storage**: S3 (for remediated HTML)

---

## 🚀 Setup

### 1. Clone the Repo

```bash
git clone https://github.com/your-username/websibility.git
cd websibility
