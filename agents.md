# Reddit Lead Radar — Full System Agent

## 1. Product Definition

Reddit Lead Radar is a full-cycle acquisition system for Reddit.

It is NOT a simple scraper. It is a **multi-module intelligence system** that:

* Discovers leads based on intent
* Qualifies them using AI
* Assists in human-like responses
* Tracks outcomes (conversion)
* Enables proactive positioning (content)
* Protects user accounts from bans
* Manages multi-account and team coordination

The system replaces:

* manual Reddit monitoring
* manual lead qualification
* manual response writing
* fragmented tracking

---

## 2. System Scope (FULL — NO SIMPLIFICATION)

The agent is allowed and expected to implement ALL modules:

* Lead Discovery Engine
* AI Classification Pipeline
* Searchbox (Inbox UI)
* Reply Generator
* Leads Pipeline (CRM)
* Ghostwriter (thread continuation)
* Content Lab
* Account Protection System
* Collision Detection
* Analytics & Tracking
* Integrations (future-ready)

However:

The system must be built as a **coherent architecture**, not as disconnected features.

---

## 3. Core System Architecture

### 3.1 Event-Driven System

All backend logic must follow an event-driven architecture.

Main flow:

* scraper/scheduled
* posts/discovered
* posts/classified
* leads/qualified
* leads/updated
* leads/replied
* threads/updated

No tightly coupled synchronous pipelines.

---

### 3.2 Data Model (Core Entities)

The system revolves around:

* users
* projects
* keywords
* competitors
* leads
* lead_replies
* conversation_threads
* reddit_accounts
* content_drafts
* analytics events

Each entity must be:

* normalized
* scalable
* multi-tenant safe (RLS)

---

### 3.3 Multi-Project Architecture

* One user can manage multiple projects
* Each project has:

  * its own keywords
  * its own leads
  * its own Reddit accounts
  * its own strategy

Isolation is critical.

---

## 4. Core Modules Behavior

### 4.1 Lead Discovery Engine

Responsible for ingesting Reddit data.

Sources:

* Reddit API (primary)
* External scraping (secondary)

Must:

* deduplicate posts
* store raw data
* trigger classification

---

### 4.2 AI Classification System

Each post must be enriched with:

* intent_score (0–100)
* sentiment
* relevance to project
* competitor mentions
* regional signals

Must support:

* batch processing
* low-cost classification models
* caching

---

### 4.3 Searchbox (Operational Core)

This is the main user interface.

Must behave like:
→ an inbox for opportunities

Capabilities:

* list of leads
* filters (intent, unanswered, competitor, trending)
* lead detail view
* actions:

  * generate reply
  * mark status
  * snooze
  * assign

---

### 4.4 Reply Generator

Must generate human-like Reddit responses.

Requirements:

* context-aware (reads post + comments)
* multiple tones:

  * engaging
  * direct
  * balanced
  * custom
* adaptive to subreddit norms
* avoids spam patterns
* avoids repetition

This is a core value driver.

---

### 4.5 Leads Pipeline

Each lead must move through:

* New
* Reviewing
* Replied
* Won
* Lost
* Irrelevant

This enables:
→ ROI tracking
→ conversion analysis

---

### 4.6 Ghostwriter System

Handles ongoing conversations.

Must:

* detect replies to user comments
* suggest next responses
* maintain conversation context
* follow a progression:

  * value → trust → pitch → conversion

Includes:

* thread tracking
* conversation state

---

### 4.7 Content Lab

Proactive growth system.

Capabilities:

* generate post ideas
* generate drafts
* optimize for subreddit rules
* track performance

This complements inbound acquisition.

---

### 4.8 Account Protection System

Critical safety layer.

Must dynamically adapt based on:

* karma
* account age
* activity patterns

Controls:

* reply limits
* cooldowns
* link usage
* warm-up suggestions

Goal:
→ prevent bans
→ maintain account health

---

### 4.9 Collision Detection

For multi-account setups.

Must:

* prevent multiple accounts replying to same thread
* implement thread locking
* support controlled reinforcement

---

### 4.10 Analytics System

Must track:

* lead funnel (new → replied → won)
* reply performance
* subreddit performance
* engagement metrics
* ROI

---

## 5. AI System Design

### 5.1 Model Usage

Different models for different tasks:

* classification → cheaper models
* generation → higher quality models

---

### 5.2 Provider Abstraction

The system MUST support:

* OpenAI (primary)
* fallback provider (Anthropic)

No hard dependency on a single provider.

---

### 5.3 Cost Optimization

* caching required
* batch processing required
* reuse embeddings when possible

---

## 6. Infrastructure

* Frontend: Next.js (App Router)
* Database: Supabase (Postgres + RLS)
* Jobs: Inngest
* Cache: Redis (Upstash)
* Payments: LemonSqueezy

---

## 7. System Behavior Principles

### 7.1 Human-in-the-loop

* The system NEVER posts automatically
* All actions are assistive

---

### 7.2 Authenticity First

* Avoid spam-like patterns
* Adapt to community norms
* prioritize value

---

### 7.3 Signal over Noise

* prioritize high intent leads
* avoid overwhelming the user

---

## 8. Implementation Strategy

The system should be built incrementally BUT:

* All modules must be designed with final architecture in mind
* No throwaway code
* No temporary hacks that break scalability

Features can start simple, but must be extensible.

---

## 9. Constraints

* Reddit ToS compliance is critical
* Avoid aggressive automation patterns
* Respect API limits
* Ensure data isolation and security

---

## 10. Agent Behavior Rules

When implementing:

* Always align with system architecture
* Do not create disconnected features
* Reuse existing modules when possible
* Prefer clarity over cleverness

If a feature is complex:
→ implement a minimal working version that fits architecture
→ allow future expansion

---

## 11. Objective

Build a **complete, production-grade system** that:

* can scale
* can handle multiple users/projects
* can operate continuously
* delivers real acquisition value

The system should be usable as a real SaaS product, not a prototype.

---

End of Agent Definition
