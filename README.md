
# DCSNS: Distributed Cognitive Self-Healing Network System for CubeSat Telemetry Resilience

## 🚀 Overview

DCSNS (Distributed Cognitive Self-Healing Network System) is a research-oriented CubeSat telemetry resilience simulator designed to evaluate how distributed sensor networks can survive extreme orbital damage scenarios while maintaining communication with the On-Board Computer (OBC).

The project models a CubeSat as a dynamic graph of interconnected sensing and communication nodes. Under radiation events, debris impacts, thermal degradation, and cascading failures, DCSNS autonomously reroutes telemetry, maintains sensing continuity, and evaluates network survivability using real-time resilience metrics.

Unlike conventional static telemetry architectures, DCSNS focuses on adaptive recovery, network persistence, and mission survivability under severe fault conditions.

---

## 🎯 Objectives

* Maintain telemetry flow under catastrophic node failures.
* Preserve sensing coverage despite sensor degradation.
* Recover communication routes automatically after damage.
* Quantify CubeSat survivability using network-science metrics.
* Compare adaptive self-healing against classical routing protocols.
* Validate resilience through stochastic Monte Carlo simulations.

---

## 🛰 System Architecture

```text
Sensor Layer
     │
     ▼
Distributed Cognitive Self-Healing Network (DCSNS)
     │
     ▼
Adaptive Routing & Recovery Engine
     │
     ▼
Telemetry Aggregation Layer
     │
     ▼
On-Board Computer (OBC)
     │
     ▼
Mission Health & Survivability Analysis
```

---

## 🔬 Simulated Failure Scenarios

### ☀️ Solar Flare Bombardment

* Progressive node degradation
* Packet corruption
* Communication instability
* Increased latency

### ☄️ Orbital Debris Penetration

* Permanent node destruction
* Link severance
* Localized topology collapse

### 🌡 Thermal Hull Degradation

* Reduced communication range
* Increased packet loss
* Energy inefficiencies

### ⚠️ Cascading Failure Injection

* Randomized node shutdowns
* Multi-hop route disruption
* Network fragmentation analysis

---

## 📊 Evaluation Metrics

### Connectivity Ratio

Percentage of surviving nodes that maintain a communication path to the OBC.

### Coverage Persistence

Percentage of CubeSat sensing area still monitored after failures.

### Packet Delivery Ratio (PDR)

Ratio of successfully delivered telemetry packets to transmitted packets.

### Recovery Speed

Time required for the network to re-establish stable communication after damage.

### Spacecraft Survivability Index (SSI)

```text
SSI =
0.35 × Connectivity
+ 0.25 × Coverage
+ 0.25 × PDR
+ 0.15 × Recovery Efficiency
```

The SSI provides a single composite survivability score representing the operational state of the spacecraft.

---

## 🧠 Self-Healing Routing Engine (SQSH)

The Sub-Quantum Self-Healing (SQSH) engine dynamically evaluates node and link quality to maintain telemetry flow.

Routing decisions are based on:

```text
NodeScore =
0.30 × NodeHealth
+ 0.25 × LinkHealth
+ 0.15 × RemainingEnergy
+ 0.15 × ReliabilityHistory
+ 0.15 × BetweennessCentrality
```

Features include:

* Adaptive rerouting
* Predictive failure avoidance
* Backup route caching
* Congestion avoidance
* Energy-aware path selection
* Distributed route recovery

---

## 📈 Benchmarking Protocols

DCSNS compares performance against:

| Protocol         | Description                   |
| ---------------- | ----------------------------- |
| Static Mesh      | Conventional fixed routing    |
| BFS Routing      | Breadth-First Search          |
| Dynamic Dijkstra | Shortest-path optimization    |
| Flooding Mesh    | Broadcast-style routing       |
| SQSH             | Adaptive self-healing routing |

Metrics evaluated:

* Connectivity
* Coverage
* Packet Delivery Ratio
* Recovery Latency
* Power Consumption
* Survivability Score

---

## 🎲 Monte Carlo Validation

The simulator supports stochastic validation through:

* 100-run analysis
* 500-run analysis
* 1000-run analysis

For each scenario the framework computes:

* Mean Connectivity
* Mean Coverage
* Mean PDR
* Mean Recovery Time
* Mean Energy Consumption
* Standard Deviation
* 95% Confidence Intervals

---

## 📉 Network Science Analytics

Implemented graph-theoretic metrics include:

* Largest Connected Component (LCC)
* Average Path Length
* Graph Diameter
* Betweenness Centrality
* Closeness Centrality
* Network Efficiency

These metrics help quantify resilience under progressive spacecraft damage.

---

## 🔋 Energy Analysis

DCSNS continuously evaluates:

* Active Power Draw
* Energy Cost per Packet
* Routing Overhead Allocation
* Recovery Energy Expenditure

The objective is to maximize survivability while minimizing energy consumption.

---

## 📂 Export Capabilities

Supported outputs:

* CSV telemetry history
* JSON validation datasets
* Network topology snapshots
* Simulation statistics
* Monte Carlo reports

---

## 🛠 Technology Stack

* TypeScript / JavaScript
* Three.js
* Graph-based network simulation
* Monte Carlo statistical validation
* Real-time telemetry analytics
* Adaptive routing algorithms

---

## 🌍 Applications

* CubeSat mission resilience analysis
* Spacecraft fault-tolerance research
* Digital twin validation
* Telemetry survivability studies
* Autonomous spacecraft networking
* Aerospace systems education

---

## Future Work

* Digital Twin integration
* Predictive OBC health monitoring
* Reinforcement learning routing policies
* Swarm CubeSat networking
* Radiation-aware adaptive protocols
* Hardware-in-the-loop validation

---

## Author

**Chakhyusa Saisrita Mittra**

</div>

# Run and deploy your simulation

This contains everything you need to run your app locally.

View your simulation in AI Studio: https://ai.studio/apps/7365d160-69da-4bfa-8c96-0de09c7cb3a5

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`
