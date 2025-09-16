## Identity Reconciliation Service

🔗 [**Live Link**](https://identity-reconciliation-server.vercel.app/)


A minimal Express + TypeScript + Prisma service that reconciles user identities across email and phone, ensuring a single primary contact with linked secondary contacts.

### Tech stack
- **Runtime**: Node.js, TypeScript
- **Web**: Express
- **ORM**: Prisma (PostgreSQL)

### Architecture diagram
```mermaid
flowchart TD

A([Start /identify request]) --> B{Any matching contacts?}

B -->|No| C[Create new Primary contact]
C --> D([Return response with new primary])

B -->|Yes| E[Resolve true primary and cluster]

E --> F{How many primaries?}
F -->|One| G[Keep as true primary]
F -->|Multiple| H[Select oldest as true primary]
H --> I[Downgrade newer primaries + re-link children]

G --> J{Does request add unseen email/phone?}
H --> J

J -->|Yes| K[Create new Secondary contact linked to primary]
J -->|No| L[No new contact created]

K --> M[Build consolidated response]
L --> M[Build consolidated response]

M --> N([Return response with primary ID, emails, phones, secondary IDs])

%% === STYLES ===
style A fill:#2ecc71,stroke:#1e8449,color:#fff
style D fill:#2ecc71,stroke:#1e8449,color:#fff
style N fill:#2ecc71,stroke:#1e8449,color:#fff

style B fill:#3498db,stroke:#1f618d,color:#fff
style F fill:#3498db,stroke:#1f618d,color:#fff
style J fill:#3498db,stroke:#1f618d,color:#fff

style C fill:#e67e22,stroke:#935116,color:#fff
style E fill:#9b59b6,stroke:#5e3370,color:#fff
style G fill:#e67e22,stroke:#935116,color:#fff
style H fill:#9b59b6,stroke:#5e3370,color:#fff
style I fill:#9b59b6,stroke:#5e3370,color:#fff
style K fill:#e67e22,stroke:#935116,color:#fff
style L fill:#e67e22,stroke:#935116,color:#fff
style M fill:#e67e22,stroke:#935116,color:#fff


```


### Getting started
1. Install dependencies:
```bash
npm install
```
2. Configure environment:
   - Create a `.env` file with:
```bash
DATABASE_URL="postgresql://<user>:<password>@<host>:<port>/<db>?schema=public"
# Optional
PORT=3000
```
3. Generate client and run migrations:
```bash
npx prisma generate
npx prisma migrate dev
```
4. (Optional) Seed sample data:
```bash
npx prisma db seed
```
5. Start the dev server:
```bash
npm run dev
```

The server will start on `http://localhost:3000` (or `PORT`).

### API
- **POST** `/api/v1/identify`
  - Reconciles the identity using `email` and/or `phoneNumber`, returning the primary contact and deduplicated identifiers.

Request
```json
{
  "email": "rose@bitespeed.com",
  "phoneNumber": "+1-202-555-0199"
}
```

Response
```json
{
  "contact": {
    "primaryContactId": 1,
    "emails": ["rose@bitespeed.com", "r.rose@work.com"],
    "phoneNumbers": ["+1-202-555-0199", "+1-202-555-0123"],
    "secondaryContactIds": [2, 3]
  }
}
```

### Data model (Prisma)
- `Contact` self-references to model primary/secondary linkage
- `linkPrecedence`: `primary` | `secondary`
- Secondary contacts point to the primary via `linkedId`


### Scripts
- **dev**: `nodemon src/index.ts`

### Health check
- `GET /` → returns a simple greeting to verify the service is running.


