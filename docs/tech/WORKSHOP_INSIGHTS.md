# Vera Workshop Insights Summary

## Source

This summary is based on the Google Doc titled "Designing for Inclusive Communication: Insights from a Co-Design Workshop on Live Captioning Systems" for the Sunva AI project.

## Why This Matters

The workshop findings are highly relevant to Vera because they validate the core thesis that the problem is not just live transcription accuracy. The harder and more meaningful problem is helping deaf and hard-of-hearing users understand and respond during real conversation with limited reading time and high cognitive load.

## Participants

The session included seven participants between the ages of 20 and 35 from the Deaf and Hard-of-Hearing community and people with speech irregularities.

Participant backgrounds included:

- partial to profound hearing loss
- oral communication and lip reading users
- sign language-first users
- hearing aid users
- people from different professional and linguistic backgrounds

This matters because the findings reflect real variability in communication needs, not a single user profile.

## Core Pain Points Identified

The workshop surfaced a set of recurring failures in existing live captioning systems.

### 1. Caption speed is hard to control

Users struggled with the pace of captions. Rapid text made it difficult to keep up, go back, or recover after missing part of a sentence.

### 2. Background noise pollutes the transcript

Non-essential sounds, filler words, and surrounding noise cluttered the captions and made reading harder.

### 3. Speaker identity is unclear

In multi-person conversations, users often could not tell who was speaking, which reduced comprehension.

### 4. Multilingual communication breaks current systems

Users reported that current tools handle multilingual or mixed-language speech poorly and often privilege monolingual English use.

### 5. Language can be technically accurate but still hard to understand

Participants described difficulty understanding advanced or non-conversational English even when captions were "correct."

### 6. Responding remains difficult

Captioning helps users receive information, but it does not solve the problem of responding quickly and comfortably.

### 7. Captions can mislead even when they appear accurate

Users highlighted that technically accurate captions can still misrepresent meaning, intent, or emotional context.

### 8. Cognitive load is a major issue

Users found it difficult to split attention between the caption screen and the surrounding conversation.

## Strongest Product Signals

Several findings stand out as especially important for Vera.

### Text simplification is not optional

Text simplification was one of the highest-priority features in the workshop. Users explicitly connected simplification to language understanding and lower cognitive burden.

### Caption speed control is a first-class feature

Users want low latency by default, but they also want the ability to slow captions down or adapt the flow based on their reading capacity.

### Assistance with replying matters as much as listening

The workshop confirms that receiving speech is only half the problem. Users also need support producing responses, especially via text-to-speech.

### Multilingual and mixed-language support are essential

Local language support and mixed-language support such as Hinglish or Manglish are important in the actual use environment.

### Multi-speaker support has clear value

Users want speaker identification in live conversations, especially in professional or social settings where multiple speakers are common.

## Prioritized Features From the Workshop

The workshop highlighted the following as the most relevant product opportunities.

### Highest-priority requests

- Text simplification
- Control live caption speed
- Multi-speaker identification
- Third-party app support
- Multilingual support
- Text-to-speech

### Notable secondary requests

- Elaborate points on demand
- Mixed-language support
- Accent detection
- Better TTS voice quality
- Context-sensitive TTS tone and style

## What Users Already Liked In Sunva

Participants found the following prototype behaviors useful:

- LLM-based cleanup of text before TTS
- text highlighting
- automatic switching between simplification and highlighting
- text-to-speech support

This is important because Vera should preserve the spirit of these strengths instead of replacing them blindly.

## What Users Wanted Improved

The strongest improvement requests were:

- better UI and onboarding so deaf users can immediately understand how to use the product
- multiple candidate TTS rewrites instead of one automatic rewrite
- tone/style adaptation in TTS for different contexts such as professional vs casual use
- stronger real-time text correction

## Product Implications For Vera

These findings directly support the Vera architecture and positioning.

### 1. Vera should optimize for readability, not just transcription

The workshop repeatedly shows that comprehension is limited by language density, reading speed, and context, not just recognition quality.

### 2. Vera should support adaptive caption density

Caption speed control and simplification should be treated as core product behavior, not optional polish.

### 3. Vera should preserve user control and trust

Users should be able to switch between original live captions and transformed text, and choose among reply suggestions rather than being forced into a single rewrite.

### 4. Vera should be multilingual by design

The product should not assume English-only conversations.

### 5. Vera should support both understanding and responding

The conversation loop should include captioning and reply assistance as equal design priorities.

## Recommendations For The Rebuild

Based on the workshop, Vera should prioritize:

1. low-latency streaming captions with adjustable density or speed behavior
2. a simplified caption mode that preserves meaning while reducing reading load
3. stable caption rendering that reduces attention switching costs
4. assisted replies with multiple rewrite options for TTS
5. English-first implementation with a multilingual roadmap from the start
6. multi-speaker awareness in the product roadmap, even if not fully shipped in the first milestone
7. a compact single-button control in the bottom action row that defaults to simplified captions and can switch to the full-caption view when needed

## Summary

The workshop strongly validates Vera's direction as a real-time readability and communication aid, not just a live captioning app. The most important needs are simplified understanding, controllable reading pace, support for responding, multilingual reality, and better handling of real-world conversation complexity.
