//higerorder function means returninf a function in it
const asyncHandler = (requestHandler)=>{
    return(req, res ,next) => {
        Promise
        .resolve(requestHandler(req, res,next))
        .catch((err)=> next(err))
    }
};
export{ asyncHandler};