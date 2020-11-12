/* global describe, it, chai */
var expect = chai.expect
describe('copyableCommand', function () {
  it('should return the same input', function () {
    const input = 'echo "foo"'
    expect(window.neo4jDocs.copyableCommand(input)).to.eq(input)
  })
  it('should remove leading $', function () {
    const input = '$ echo "foo"'
    expect(window.neo4jDocs.copyableCommand(input)).to.eq('echo "foo"')
  })
  it('should join commands with ; and remove leading $', function () {
    const input = `$ echo "foo"
$ echo "bar"`
    expect(window.neo4jDocs.copyableCommand(input)).to.eq('echo "foo"; echo "bar"')
  })
  it('should ignore command output', function () {
    const input = `$ echo "foo"
foo
$ echo "bar"
bar`
    expect(window.neo4jDocs.copyableCommand(input)).to.eq('echo "foo"; echo "bar"')
  })
  it('should continue command', function () {
    const input = `$ curl -X POST \\
-H "Content-Type: application/json" \\
-d '{"query": "{ hello }"}' \\
https://localhost/graphql
{ data: { hello: 'Hello world!' } }

$ echo "bar"
bar`
    expect(window.neo4jDocs.copyableCommand(input)).to.eq(`curl -X POST \\
-H "Content-Type: application/json" \\
-d '{"query": "{ hello }"}' \\
https://localhost/graphql; echo "bar"`)
  })
})
