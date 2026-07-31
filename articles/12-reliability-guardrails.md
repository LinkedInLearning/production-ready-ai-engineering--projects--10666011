# 12 - Reliability guardrails for AI features

**tl;dr: an AI feature is not reliable because the model usually works. It is reliable when failures are visible and survivable.**

The Suggested Reply path depends on a model call. Model calls can be slow, fail, return empty output, or produce something the product should not use. Reliability work starts by assuming those things will happen.

First, make the path visible.

For the course app, lightweight local telemetry is enough:

- model latency,
- error count,
- timeout count,
- fallback count,
- degraded response marker.

Then make failure survivable:

- timeout so the request does not hang,
- retry only where safe,
- circuit breaker for repeated failures,
- deterministic template fallback,
- output validation for empty, oversized, or unsafe replies.

The demo should deliberately kill or slow the model path. Before hardening, the request hangs or fails. After hardening, it returns quickly with a fallback and marks the response as degraded.

That degraded marker matters. Silent fallback can hide incidents. Visible fallback lets the team track when the system is no longer delivering the AI path users expect.

Reliability also feeds everything downstream. CI can only gate on a signal that exists, and you can only change inherited code confidently when you can see it degrade. Instrumentation is not decoration. It is the sensor that makes the rest of the last mile possible.

The useful standard is: see it fail, survive the failure, and report the degraded path clearly enough that a human can act.
