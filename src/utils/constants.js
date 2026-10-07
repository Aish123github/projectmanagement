// "Give me one particular role."
export const UserRolesEnum = {
    ADMIN: "admin",
    PROJECT_ADMIN: "project_admin",
    MEMBER: "member"
}
// iske upar we were just sending the whole object at ones but 
//niche we are sendinf array
//Give me all the roles so I can check/validate something
export const AvailableUserRole = Object.values(UserRolesEnum);

export const TaskStatusEnum = {
    TODO: "todo",
    IN_PROGRESS: "in_progress",
    DONE: "done"
}
export const AvailableTaskStatues = Object.values(TaskStatusEnum);