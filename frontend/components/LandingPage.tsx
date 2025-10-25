'use client';

import { motion } from 'framer-motion';
import { Bot, Zap, Shield, Target, CheckCircle, Code2 } from 'lucide-react';
import Link from 'next/link';

export function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <h1 className="text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              AI Agent Testing Framework
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              Visualize, test, and optimize your LangChain AI agents with our interactive testing framework.
              Analyze your codebase, generate comprehensive test cases, and improve agent performance.
            </p>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-lg font-medium"
            >
              <Bot className="w-5 h-5" />
              Get Started
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-4xl font-bold mb-12 text-center">
            Powerful Features for Agent Testing
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Code2 className="w-8 h-8" />}
              title="Code Analysis"
              description="Automatically scrape and analyze your GitHub repository to identify agents, tools, and their relationships."
            />
            <FeatureCard
              icon={<Target className="w-8 h-8" />}
              title="Interactive Visualization"
              description="View your agent architecture in an interactive canvas. Zoom, pan, and explore agent connections."
            />
            <FeatureCard
              icon={<Zap className="w-8 h-8" />}
              title="Automated Testing"
              description="Generate 10 comprehensive test cases covering hyperparameters, security, tool calling, and more."
            />
            <FeatureCard
              icon={<Shield className="w-8 h-8" />}
              title="Security Analysis"
              description="Test for prompt injection vulnerabilities and other security concerns in your AI agents."
            />
            <FeatureCard
              icon={<CheckCircle className="w-8 h-8" />}
              title="Smart Recommendations"
              description="Get AI-powered fix suggestions with exact file locations and code changes."
            />
            <FeatureCard
              icon={<Bot className="w-8 h-8" />}
              title="Real-time Editing"
              description="Edit agent configurations and tool code directly, with changes reflected in your codebase."
            />
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-4xl font-bold mb-12 text-center">
            How It Works
          </h2>
          <div className="grid md:grid-cols-4 gap-6">
            <StepCard
              number="1"
              title="Submit Repository"
              description="Enter your GitHub repository URL containing LangChain agents."
            />
            <StepCard
              number="2"
              title="Analyze & Visualize"
              description="Our AI analyzes your code and creates an interactive visual graph."
            />
            <StepCard
              number="3"
              title="Run Tests"
              description="Generate and execute comprehensive test cases for your agents."
            />
            <StepCard
              number="4"
              title="Apply Fixes"
              description="Review recommendations and apply fixes with one click."
            />
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-4xl font-bold mb-12 text-center">
            Simple, Transparent Pricing
          </h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <PricingCard
              title="Basic"
              price="Free"
              features={[
                'Up to 5 repositories',
                '10 test cases per run',
                'Basic visualization',
                'Community support',
              ]}
            />
            <PricingCard
              title="Pro"
              price="$29"
              period="/month"
              featured
              features={[
                'Unlimited repositories',
                'Unlimited test cases',
                'Advanced analytics',
                'Priority support',
                'Custom test scenarios',
              ]}
            />
            <PricingCard
              title="Enterprise"
              price="Custom"
              features={[
                'Everything in Pro',
                'Dedicated support',
                'Custom integrations',
                'SLA guarantee',
                'On-premise deployment',
              ]}
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-4xl font-bold mb-6">
            Ready to Test Your AI Agents?
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Start analyzing and optimizing your LangChain agents today.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-lg font-medium"
          >
            Try It Now
          </Link>
        </div>
      </section>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="p-6 rounded-lg border border-border bg-card hover:shadow-lg transition-shadow"
    >
      <div className="text-primary mb-4">{icon}</div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </motion.div>
  );
}

function StepCard({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div className="text-center">
      <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold mx-auto mb-4">
        {number}
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

function PricingCard({
  title,
  price,
  period,
  features,
  featured,
}: {
  title: string;
  price: string;
  period?: string;
  features: string[];
  featured?: boolean;
}) {
  return (
    <div
      className={`p-8 rounded-lg border ${
        featured
          ? 'border-primary bg-primary/5 scale-105'
          : 'border-border bg-card'
      }`}
    >
      <h3 className="text-2xl font-bold mb-2">{title}</h3>
      <div className="mb-6">
        <span className="text-4xl font-bold">{price}</span>
        {period && <span className="text-muted-foreground">{period}</span>}
      </div>
      <ul className="space-y-3 mb-8">
        {features.map((feature, i) => (
          <li key={i} className="flex items-start gap-2">
            <CheckCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <span className="text-sm">{feature}</span>
          </li>
        ))}
      </ul>
      <button
        className={`w-full py-2 rounded-md font-medium transition-colors ${
          featured
            ? 'bg-primary text-primary-foreground hover:bg-primary/90'
            : 'border border-border hover:bg-muted'
        }`}
      >
        Get Started
      </button>
    </div>
  );
}
