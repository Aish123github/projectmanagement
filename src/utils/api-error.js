class ApiError extends Error {
    constructor(
        statusCode , 
        message = "something went wrong",
        errors =[],
        stack =""
        //A stack trace helps us understand Where exactly did this error happen in our code?
    ){ // caliing class error 
        super(message)
        this.statusCode = statusCode
        this.data = null
        this.message = message
        this.success = false 
        this.errors = errors
   
        if(stack){
            this.stack = stack 
        }
        else {
            Error.captureStackTrace(this , this.constructor)
        }
    }
}
export {ApiError};