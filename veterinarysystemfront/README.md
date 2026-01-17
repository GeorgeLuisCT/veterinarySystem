# 💻 Veterinary System - Frontend

The modern, responsive client-side application for the Veterinary System. Built with Next.js 15, this interface provides a premium user experience for managing veterinary clinics.

## 🚀 Technology Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
- **Language**: TypeScript
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **Components**: [Radix UI](https://www.radix-ui.com/), [Lucide Icons](https://lucide.dev/)
- **State/Data**: React Hook Form, Axios, SWR/TanStack Query (recommended)

## 🛠️ Prerequisites

- **Node.js** (LTS version recommended)
- **npm** or **yarn**

## ⚙️ Configuration

Create a `.env.local` file in this directory to handle local environment variables (though mostly handled by the root configuration in production).

```ini
NEXT_PUBLIC_API_URL=http://localhost:8080/api
```

## 🏁 Getting Started (Local Development)

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Run Development Server**
   ```bash
   npm run dev
   ```

3. **Open Browser**
   Navigate to [http://localhost:3000](http://localhost:3000).

## 🐳 Docker Support

To build the Docker image for this service specifically:

```bash
docker build -t veterinary-frontend .
```

In the full stack setup, this container is typically accessed through the Nginx reverse proxy on port 80.
