package backend.service;

import backend.dto.TaskRequest;
import backend.dto.TaskResponse;
import backend.entities.Role;
import backend.entities.Task;
import backend.entities.User;
import backend.repository.TaskRepository;
import backend.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@Service
public class TaskService {

    private final TaskRepository taskRepository;
    private final UserRepository userRepository;

    public TaskService(TaskRepository taskRepository, UserRepository userRepository) {
        this.taskRepository = taskRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<TaskResponse> getMyTasks(Authentication authentication) {
        User currentUser = getCurrentUser(authentication);
        return taskRepository.findByOwnerOrderByCreatedAtDesc(currentUser).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<TaskResponse> getAllTasks() {
        return taskRepository.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public TaskResponse getTask(UUID id, Authentication authentication) {
        Task task = findTask(id);
        ensureAllowed(task, getCurrentUser(authentication));
        return toResponse(task);
    }

    @Transactional
    public TaskResponse createTask(TaskRequest request, Authentication authentication) {
        User currentUser = getCurrentUser(authentication);

        Task task = new Task();
        applyRequest(task, request);
        task.setOwner(currentUser);

        return toResponse(taskRepository.save(task));
    }

    @Transactional
    public TaskResponse updateTask(UUID id, TaskRequest request, Authentication authentication) {
        Task task = findTask(id);
        ensureAllowed(task, getCurrentUser(authentication));
        applyRequest(task, request);

        return toResponse(taskRepository.save(task));
    }

    @Transactional
    public void deleteTask(UUID id, Authentication authentication) {
        Task task = findTask(id);
        ensureAllowed(task, getCurrentUser(authentication));
        taskRepository.delete(task);
    }

    private Task findTask(UUID id) {
        return taskRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Task not found"));
    }

    private User getCurrentUser(Authentication authentication) {
        return userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authenticated user not found"));
    }

    private void ensureAllowed(Task task, User currentUser) {
        if (currentUser.getRole() == Role.ADMIN || task.getOwner().getId().equals(currentUser.getId())) {
            return;
        }
        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You do not have access to this task");
    }

    private void applyRequest(Task task, TaskRequest request) {
        task.setTitle(request.getTitle().trim());
        task.setDescription(request.getDescription() == null ? null : request.getDescription().trim());
        if (request.getCompleted() != null) {
            task.setCompleted(request.getCompleted());
        }
    }

    private TaskResponse toResponse(Task task) {
        return new TaskResponse(
                task.getId(),
                task.getTitle(),
                task.getDescription(),
                task.isCompleted(),
                task.getOwner().getId(),
                task.getCreatedAt(),
                task.getUpdatedAt()
        );
    }
}
