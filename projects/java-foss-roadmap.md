# Java FOSS Contribution Roadmap

This is the current contribution focus for building Java open-source credibility, learning strong library engineering, and staying close to widely used projects.

## Primary Ecosystem

### 1. Apache Commons

Small, mature Java libraries with high usage and careful maintainer standards.

Good for learning:

- API compatibility
- Edge-case testing
- Javadocs and documentation quality
- Small utility-library design
- Maintainer-style judgment

Useful links:

- [Apache Commons](https://commons.apache.org/)
- [Apache Commons GitHub](https://github.com/apache?q=commons&type=all&language=java&sort=)
- [Commons Lang](https://github.com/apache/commons-lang)
- [Commons Lang JIRA](https://issues.apache.org/jira/projects/LANG/issues)
- [Commons IO](https://github.com/apache/commons-io)
- [Commons IO JIRA](https://issues.apache.org/jira/projects/IO/issues)
- [Commons CSV](https://github.com/apache/commons-csv)
- [Commons CSV JIRA](https://issues.apache.org/jira/projects/CSV/issues)
- [Commons Codec](https://github.com/apache/commons-codec)
- [Commons Codec JIRA](https://issues.apache.org/jira/projects/CODEC/issues)
- [Commons Text](https://github.com/apache/commons-text)
- [Commons Text JIRA](https://issues.apache.org/jira/projects/TEXT/issues)

Current local repos:

- `/Users/sbaskar/Personal/projects/commons-lang`
- `/Users/sbaskar/Personal/projects/commons-io`

Contribution strategy:

- Start with small bugs, tests, and Javadocs.
- Avoid large behavior changes without maintainer confirmation.
- Prefer issues with clear acceptance criteria and no active PR.
- Comment with reproduction notes before coding when behavior is ambiguous.

## Secondary Ecosystem

### 2. AssertJ

Widely used Java assertion library with a fluent API.

Good for learning:

- Fluent API design
- Generics
- Test readability
- Developer experience
- Strong test coverage patterns

Useful links:

- [AssertJ GitHub Organization](https://github.com/assertj)
- [AssertJ Core](https://github.com/assertj/assertj)
- [AssertJ Issues](https://github.com/assertj/assertj/issues)
- [AssertJ Good First Issues](https://github.com/assertj/assertj/issues?q=is%3Aissue%20is%3Aopen%20label%3A%22good%20first%20issue%22)
- [AssertJ Documentation](https://assertj.github.io/doc/)

Contribution strategy:

- Look for missing assertion coverage.
- Add focused tests before changing behavior.
- Prefer API consistency fixes and documentation examples.
- Avoid broad API additions until familiar with existing style.

## Third Pillar

### 3. Jackson

Core Java JSON serialization/deserialization ecosystem used heavily by Spring Boot, Quarkus, Micronaut, Dropwizard, Kafka tooling, and many enterprise apps.

Good for learning:

- JSON parsing and generation
- Reflection and annotations
- Java type resolution
- Serialization/deserialization edge cases
- Compatibility and performance-sensitive code

Useful links:

- [Jackson GitHub Organization](https://github.com/FasterXML)
- [jackson-core](https://github.com/FasterXML/jackson-core)
- [jackson-databind](https://github.com/FasterXML/jackson-databind)
- [jackson-annotations](https://github.com/FasterXML/jackson-annotations)
- [jackson-modules-java8](https://github.com/FasterXML/jackson-modules-java8)
- [jackson-dataformats-text](https://github.com/FasterXML/jackson-dataformats-text)
- [Jackson Docs](https://github.com/FasterXML/jackson-docs)
- [Jackson Wiki](https://github.com/FasterXML/jackson-docs/wiki)

Recommended entry points:

- `jackson-modules-java8` for Java date/time and Optional handling.
- `jackson-dataformats-text` for CSV/properties/YAML-style modules.
- `jackson-core` for parser/generator tests.
- `jackson-docs` for first documentation fixes.
- `jackson-databind` later, after gaining confidence.

Avoid at first:

- Polymorphic deserialization security issues.
- Large type-resolution changes.
- Performance rewrites.
- New public APIs without prior maintainer discussion.

## Suggested Growth Path

1. Build consistency in Apache Commons.
2. Add AssertJ for testing-library/API design credibility.
3. Move into Jackson for deeper backend-library credibility.
4. Later consider Log4j 2, JUnit 5, Testcontainers, or Netty depending on interest.

## Weekly Routine

1. Check open issues and open PRs.
2. Pick one small, unclaimed issue.
3. Reproduce locally.
4. Comment with findings if behavior is unclear.
5. Create a focused branch.
6. Add tests or docs.
7. Run focused tests.
8. Submit a small PR.
9. Respond quickly and calmly to review.

## Comment Template

```text
I reproduced this on current master with Java <version>.

The current behavior is <actual behavior>. Based on the code/tests, I think the safest fix is <proposed direction>.

I can open a focused PR with tests if this direction sounds right.
```

## PR Checklist

- Keep scope small.
- Link the issue.
- Explain what changed and why.
- Mention tests run.
- Be explicit if AI was used for guidance.
- Do not mix unrelated fixes.
- Do not change public behavior unless the issue clearly requires it.

