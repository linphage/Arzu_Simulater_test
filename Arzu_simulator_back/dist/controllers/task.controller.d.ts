export declare class TaskController {
    private taskService;
    constructor();
    createTask: (req: any, res: any, next: any) => void;
    createOfficeTask: (req: any, res: any, next: any) => void;
    getUserTasks: (req: any, res: any, next: any) => void;
    getTaskById: (req: any, res: any, next: any) => void;
    updateTask: (req: any, res: any, next: any) => void;
    deleteTask: (req: any, res: any, next: any) => void;
    batchOperateTasks: (req: any, res: any, next: any) => void;
    getTaskStats: (req: any, res: any, next: any) => void;
    getTaskAnalytics: (req: any, res: any, next: any) => void;
    searchTasks: (req: any, res: any, next: any) => void;
    getUpcomingTasks: (req: any, res: any, next: any) => void;
    getOverdueTasks: (req: any, res: any, next: any) => void;
    archiveCompletedTasks: (req: any, res: any, next: any) => void;
    createPomodoroSession: (req: any, res: any, next: any) => void;
    completePomodoroSession: (req: any, res: any, next: any) => void;
    endPomodoroSession: (req: any, res: any, next: any) => void;
    getPomodoroSessions: (req: any, res: any, next: any) => void;
    getPomodoroStats: (req: any, res: any, next: any) => void;
    getActivePomodoroSession: (req: any, res: any, next: any) => void;
    updateTaskCompletionFromPomodoro: (req: any, res: any, next: any) => void;
    getCalendarCheckIns: (req: any, res: any, next: any) => void;
    createMakeUpCheckIn: (req: any, res: any, next: any) => void;
    getRecentTaskStats: (req: any, res: any, next: any) => void;
    getCompletionStats: (req: any, res: any, next: any) => void;
}
export default TaskController;
//# sourceMappingURL=task.controller.d.ts.map