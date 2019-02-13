invoke('1+1', function(error, result){
  console.log(arguments)
  console.assert(!error, 'should not throw an error')
  console.assert(result == 2, 'result should be correct')
  console.assert(result === 2, 'result should be the correct type')
})

invoke('FLARM=123', function(error, result){
  invoke('FLARM', function(error, result2){
    console.log("Should be able to modify objects in scope")
    console.assert(result2 === result)
  })
})

invoke('foo={bar:{baz:123}}', function(error, foo){
  invoke('foo.bar.baz', function(error, baz){
    console.log("Should be able to modify objects in scope")
    console.assert(baz === foo.bar.baz)
  })
})
