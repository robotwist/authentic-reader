# Council Watch: Product Requirements Document

## 1. THE MISSION

**"To decode local governance opacity and give citizens the tools to organize effective resistance or support for local legislation."**

Council Watch is a civic engagement module designed to transform how citizens interact with local government. By automating the discovery, analysis, and action pipeline for city council proceedings, we empower communities to participate meaningfully in the decisions that directly impact their daily lives.

---

## 2. THE USER JOURNEY

### Step 1: Ingest
**System scrapes City Council Agendas (PDFs) 72 hours before meetings.**

- Automated scraping service monitors city council websites
- PDFs are downloaded and parsed 72 hours prior to scheduled meetings
- Documents are stored with metadata: date, city_id, pdf_url
- Supports multiple cities/jurisdictions simultaneously

### Step 2: Decode
**LLM summarizes items, flagging "High Impact" topics (Zoning, Police Budget, Housing, Surveillance).**

- Each agenda item is extracted and processed through LLM analysis
- Automatic summarization of complex legal/government language into plain language
- Intelligent flagging system identifies high-impact topics:
  - **Zoning** - Land use, development, property rights
  - **Police Budget** - Law enforcement funding, equipment purchases
  - **Housing** - Affordable housing, tenant protections, development
  - **Surveillance** - Privacy, technology, monitoring systems
- Impact levels assigned: High / Medium / Low
- Contextual analysis provides background and potential implications

### Step 3: Alert
**User receives a "Civic Briefing" notification for their city.**

- Personalized notifications delivered to users based on their registered city
- Civic Briefing includes:
  - Meeting date and time
  - Summary of high-impact items
  - Quick links to full agenda items
  - Estimated community interest level
- Multiple notification channels: email, in-app, SMS (optional)
- Users can customize notification preferences by topic/impact level

### Step 4: Collaborate
**Users cast non-binding "Shadow Votes" (The Whip Count) to visualize community sentiment.**

- Interactive voting interface for each agenda item
- Users express their position: **Oppose** / **Support** / **Neutral**
- Real-time visualization of community sentiment:
  - Aggregate vote counts
  - Demographic breakdowns (optional, privacy-preserving)
  - Historical comparison with similar items
- "The Whip Count" dashboard shows:
  - Which items have the most engagement
  - Community consensus or division
  - Momentum tracking over time
- Non-binding votes serve as a barometer of public opinion

### Step 5: Act
**System generates custom emails/scripts for users to send to their specific representatives.**

- Action generation engine creates personalized communications:
  - **Email templates** tailored to specific agenda items
  - **Phone scripts** for calling representatives
  - **Public comment templates** for meeting participation
- Content includes:
  - User's position (from Shadow Vote)
  - Key talking points from LLM analysis
  - Specific representative contact information
  - Meeting details and deadlines
- One-click sending/sharing capabilities
- Tracking of user actions and engagement metrics

---

## 3. DATA STRUCTURE (Draft)

### Core Entities

#### `meetings`
Stores information about city council meetings.

```typescript
{
  id: string,
  date: Date,
  city_id: string,
  pdf_url: string,
  status: 'upcoming' | 'completed' | 'cancelled',
  created_at: Date,
  updated_at: Date
}
```

#### `agenda_items`
Individual items from meeting agendas, with LLM-generated analysis.

```typescript
{
  id: string,
  meeting_id: string,
  title: string,
  raw_text: string,
  summary: string,
  impact_level: 'High' | 'Medium' | 'Low',
  impact_topics: string[], // ['Zoning', 'Police Budget', 'Housing', 'Surveillance']
  llm_analysis: {
    background: string,
    implications: string,
    key_points: string[]
  },
  created_at: Date,
  updated_at: Date
}
```

#### `shadow_votes`
User votes on agenda items (The Whip Count).

```typescript
{
  id: string,
  item_id: string,
  user_id: string,
  vote: 'Oppose' | 'Support' | 'Neutral',
  created_at: Date,
  updated_at: Date
}
```

#### `cities` (Reference)
City/jurisdiction registry.

```typescript
{
  id: string,
  name: string,
  state: string,
  council_url: string,
  scraping_config: object,
  created_at: Date
}
```

#### `user_cities` (Junction)
Links users to their cities of interest.

```typescript
{
  user_id: string,
  city_id: string,
  notification_preferences: {
    email: boolean,
    sms: boolean,
    impact_levels: string[]
  },
  created_at: Date
}
```

#### `civic_actions` (Future)
Tracks user actions taken (emails sent, calls made, etc.).

```typescript
{
  id: string,
  user_id: string,
  item_id: string,
  action_type: 'email' | 'call' | 'public_comment',
  recipient: string,
  status: 'sent' | 'pending' | 'failed',
  created_at: Date
}
```

---

## 4. FUTURE EXPANSION

This Council Watch module serves as the foundation for a broader **"Civic Operating System"** that will expand into additional domains:

### Housing Module
**Tenants vs. Landlords**
- Track eviction proceedings
- Monitor housing policy changes
- Organize tenant advocacy
- Document landlord violations
- Connect tenants with legal resources

### Healthcare Module
**Billing Disputes**
- Analyze medical bills for errors
- Track healthcare policy changes
- Organize patient advocacy
- Connect users with billing dispute resources
- Monitor insurance policy changes

### Shared Infrastructure
All modules will leverage:
- User authentication and profiles
- Notification system
- LLM analysis pipeline
- Action generation engine
- Community engagement tools (voting, collaboration)
- Representative contact database

---

## Technical Considerations

### Scraping Infrastructure
- Robust PDF parsing and text extraction
- Handling various city website formats
- Error handling and retry logic
- Rate limiting and respectful scraping practices

### LLM Integration
- Efficient batch processing of agenda items
- Cost optimization for high-volume analysis
- Caching of similar items
- Quality assurance for summaries and flagging

### Privacy & Security
- User data protection
- Secure storage of voting data
- Anonymization options for public dashboards
- Compliance with local data protection regulations

### Scalability
- Multi-city support from day one
- Horizontal scaling for scraping and processing
- Efficient database queries for real-time dashboards
- CDN for PDF storage and delivery

---

## Success Metrics

- **Engagement Rate**: % of users who vote on agenda items
- **Action Rate**: % of users who send emails/calls after voting
- **Coverage**: Number of cities and meetings tracked
- **Response Time**: Time from agenda publication to user notification
- **Accuracy**: LLM flagging accuracy for high-impact items
- **Community Growth**: User growth per city

---

## Version History

- **v1.0** (Draft): Initial PRD - December 2024

