package backend.controller;

import backend.dto.ApiResponse;
import backend.dto.TaskRequest;
import backend.dto.TaskResponse;
import backend.dto.TaskUpdateRequest;
import backend.service.TaskService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/tasks")
public class TaskController {

    private final TaskService taskService;

    public TaskController(TaskService taskService) {
        this.taskService = taskService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<TaskResponse>>> getMyTasks(Authentication authentication) {
        return ResponseEntity.ok(ApiResponse.ok("Tasks fetched successfully", taskService.getMyTasks(authentication)));
    }

    @GetMapping("/admin")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<TaskResponse>>> getAllTasks() {
        return ResponseEntity.ok(ApiResponse.ok("All tasks fetched successfully", taskService.getAllTasks()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<TaskResponse>> getTask(@PathVariable UUID id, Authentication authentication) {
        return ResponseEntity.ok(ApiResponse.ok("Task fetched successfully", taskService.getTask(id, authentication)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<TaskResponse>> createTask(@Valid @RequestBody TaskRequest request, Authentication authentication) {
        return ResponseEntity.status(201).body(ApiResponse.ok("Task created successfully", taskService.createTask(request, authentication)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<TaskResponse>> updateTask(@PathVariable UUID id, @Valid @RequestBody TaskUpdateRequest request, Authentication authentication) {
        return ResponseEntity.ok(ApiResponse.ok("Task updated successfully", taskService.updateTask(id, request, authentication)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteTask(@PathVariable UUID id, Authentication authentication) {
        taskService.deleteTask(id, authentication);
        return ResponseEntity.ok(ApiResponse.ok("Task deleted successfully", null));
    }
}
