# User Workflow & Features Guide

## Complete User Journey

### 1. Landing Page (/)

**What Users See:**
- Hero section with project title and description
- "Get Started" button
- 6 feature cards explaining capabilities
- 4-step "How It Works" guide
- Pricing section with 3 tiers (Free, Pro, Enterprise)
- Call-to-action sections

**Actions:**
- Click "Get Started" or "Dashboard" button → Navigate to Dashboard

---

### 2. Dashboard (/dashboard)

#### Initial State

**What Users See:**
- Large canvas area (3/4 of screen) on left
- Input form in center of canvas:
  - Text input for GitHub URL
  - "Submit" button
- Empty status sidebar (1/4 of screen) on right
- Message: "Press submit or start"

**Actions:**
1. Enter GitHub repository URL (must contain LangChain agents)
2. Click "Submit"

---

#### After Submission - Analysis Phase

**What Happens:**
1. **Backend Process:**
   - Scrapes GitHub repository
   - Identifies Python/JS/TS files
   - Finds LangChain agent definitions
   - Uses Gemini AI to extract:
     * Agent names, types, prompts
     * System instructions
     * Model configurations
     * Tool usage
     * Agent relationships
     * Tool implementations

2. **Frontend Display:**
   - Canvas shows skeleton agent boxes with loading animation
   - Status sidebar shows progress messages:
     * "Starting analysis of [repo URL]"
     * "Scraping repository files..."
     * "Analyzing agents with AI..."
     * "Extracting tool definitions..."
     * "Mapping relationships..."
     * "Successfully analyzed repository. Found X agents and Y tools."

**Result:**
Structured data containing all agents, tools, and relationships

---

#### After Analysis - Visualization Phase

**Canvas Display (Left Panel):**

**Agent Nodes:**
- Box with Bot icon 🤖
- Agent name
- Brief objective text
- Blue/primary color scheme

**Tool Nodes:**
- Box with Wrench icon 🔧
- Tool name
- Brief summary
- Blue color scheme

**Connections:**
- Arrows from agents to their tools
- Arrows between related agents
- Labels showing relationship types

**Canvas Features:**
- Zoom in/out with controls
- Pan by dragging
- Background grid
- Fit view button

**Status Sidebar (Right Panel):**
- Shows all status messages from analysis
- "Start Testing" button at top
- Scrollable message list

---

#### Clicking an Agent Node

**Details Panel Appears (Right Side, Top Half):**

**Information Displayed:**
- **Header:** Agent name + "Edit" button
- **Type:** Agent type (e.g., "zero-shot-react")
- **File Path:** Where agent is defined
- **Prompt:** Full prompt template (editable)
- **System Instruction:** System message (editable)
- **Objective:** What the agent does
- **Model Configuration:**
  - Model name
  - Temperature (editable slider/input)
  - Max tokens (editable input)
- **Tools:** List of tools used (with bullet points)
- **Hyperparameters:** Custom parameters

**Actions:**
1. Click "Edit" → Enable editing mode
2. Modify any editable field
3. Click "Save" → Sends update to backend
4. Status message: "Updated agent: [name]"

---

#### Clicking a Tool Node

**Details Panel Shows:**

**Information Displayed:**
- **Header:** Tool name + "Edit" button
- **File Path:** Where tool is defined
- **Description:** What the tool does
- **Summary:** Brief summary
- **Parameters:** List with name, type, description
- **Return Type:** What the tool returns
- **Code:** Full function implementation (editable in textarea)

**Actions:**
1. Click "Edit" → Enable code editing
2. Modify code in textarea
3. Click "Save" → Updates tool code
4. Status message: "Updated tool: [name]"

---

#### Clicking a Relationship Arrow

**Details Panel Shows:**

**Information Displayed:**
- **Type:** Relationship type (calls, collaborates, sequential, parallel)
- **From Agent:** Source agent name
- **To Agent:** Target agent name
- **Description:** How they relate
- **Data Flow:** What data is passed

---

### 3. Testing Phase

#### Starting Tests

**User Action:**
Click "Start Testing" button

**What Happens:**

1. **Test Generation:**
   - Status: "Generating test cases..."
   - AI creates 10 test cases covering:
     1. Hyperparameter optimization
     2. Prompt injection attacks
     3. Tool calling accuracy
     4. Relationship validation
     5. Collaborative behavior
     6. Error handling
     7. Output quality
     8. Performance metrics
     9. Edge cases
     10. Security vulnerabilities
   - Status: "Generated 10 test cases"

2. **Test Execution:**
   For each test case:
   
   **Status Message:**
   - "Running test 1/10: [Test Name]"
   
   **Visual Highlighting:**
   - Elements being tested light up in yellow
   - If testing an agent → agent node highlighted
   - If testing a tool → tool node highlighted
   - If testing relationship → arrow highlighted
   - Animated pulse effect
   
   **Test Processing:**
   - Backend simulates test execution
   - AI evaluates results
   - Generates pass/fail status
   - Creates recommendations if issues found
   
   **Result Display:**
   - Status message: "Test 1 passed/failed: [summary]"
   - Wait 1 second, move to next test

3. **Completion:**
   - Status: "All tests completed!"
   - Highlights cleared
   - Test results section appears

---

#### Viewing Test Results

**Test Results Section (Status Panel):**

Each test result shown as a card:

**Collapsed View:**
- Test status icon (✓ or ✗)
- Summary text
- Status color (green=passed, red=failed, yellow=warning)
- Expand button ▼

**Expanded View:**
- Full summary
- Detailed findings
- Issues found (bullet list)
- Metrics (accuracy, performance, security scores)
- **Recommendations** section:
  - Issue description
  - Severity level (critical/high/medium/low)
  - Specific fix suggestion
  - File path and line number
  - Current code snippet
  - Suggested code snippet
  - Explanation of fix

---

#### Applying Fixes

**User Actions:**
1. Review recommendation in test result
2. Click "Apply Fix" button (if shown)
3. Backend applies the fix
4. Status: "Applied fix to [file]"
5. Code editor service tracks the change

---

### 4. Panel Management

**Panel Controls:**

**Status Panel (Right):**
- Always visible by default
- Shows real-time progress
- Contains "Start Testing" button
- Displays all status messages
- Shows test results

**Details Panel (Right, Above Status):**
- Appears when element clicked
- Collapsible with X button
- Shows editable information
- Save button for changes

**Panel Modes:**
- **Status Only:** Just status messages
- **Details Only:** Just selected element details
- **Both:** Split view (default when item clicked)

---

## Key Metrics & Information

### Agent Information Extracted:
- Name, Type, File Path
- Prompt Template
- System Instructions
- Model Configuration (model, temperature, max_tokens)
- Tools Used
- Hyperparameters
- Objective/Purpose
- Code Snippet

### Tool Information Extracted:
- Name, Description, Summary
- File Path
- Parameters (name, type, description)
- Return Type
- Full Code Implementation

### Relationship Information:
- Connection Type
- Source & Target Agents
- Description
- Data Flow

### Test Categories:
1. **Hyperparameter:** Test different model settings
2. **Prompt Injection:** Security vulnerability testing
3. **Tool Calling:** Correct tool usage verification
4. **Relationship:** Agent interaction testing
5. **Collaborative:** Multi-agent task testing
6. **Error Handling:** Invalid input handling
7. **Output Quality:** Response quality evaluation
8. **Performance:** Speed and resource testing
9. **Edge Cases:** Boundary condition testing
10. **Security:** Security vulnerability scanning

---

## Technical Workflow

### Data Flow:
1. User submits GitHub URL
2. Backend scrapes repository
3. Gemini AI analyzes code
4. Structured JSON returned
5. Frontend visualizes as graph
6. User explores interactively
7. User triggers testing
8. Tests execute with highlighting
9. Results displayed with recommendations
10. User applies fixes or edits code

### State Management:
- Global Zustand store
- Real-time UI updates
- Persistent test results
- Status message history
- Selection tracking
- Highlighting system

---

## Example Test Scenarios

### 1. Hyperparameter Test
**Target:** Main Agent
**Test:** Try temperature 0.2, 0.5, 0.8, 1.0
**Measure:** Output consistency and creativity
**Highlight:** Agent node pulses yellow

### 2. Prompt Injection Test
**Target:** Agent prompt
**Test:** Input malicious prompts
**Measure:** Security response
**Highlight:** Agent node + prompt section

### 3. Tool Calling Test
**Target:** Specific tool
**Test:** Verify correct parameters passed
**Measure:** Call accuracy
**Highlight:** Agent → Tool arrow

### 4. Relationship Test
**Target:** Agent-to-agent connection
**Test:** Data flow verification
**Measure:** Communication accuracy
**Highlight:** Both agents + connecting arrow

---

## Success Metrics

**Analysis Success:**
- ✅ Repository scraped
- ✅ Agents identified
- ✅ Tools extracted
- ✅ Relationships mapped
- ✅ Visual graph created

**Testing Success:**
- ✅ All 10 test cases generated
- ✅ Tests executed without errors
- ✅ Results with metrics
- ✅ Recommendations provided
- ✅ Fixes applicable

**User Experience:**
- ✅ Real-time feedback
- ✅ Visual highlighting
- ✅ Editable configurations
- ✅ One-click fixes
- ✅ Clear status messages

---

This workflow ensures a comprehensive, interactive, and user-friendly experience for testing and improving AI agents!
