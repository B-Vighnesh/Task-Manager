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

    public TaskService(TaskRepository taskRepository, UserRepository userRepository) {
    }

    public List<TaskResponse> getMyTasks(Authentication authentication) {
        return List.of();
    }

    public List<TaskResponse> getAllTasks() {
        return List.of();
    }

    public TaskResponse getTask(UUID id, Authentication authentication) {
        return null;
    }

    public TaskResponse createTask(TaskRequest request, Authentication authentication) {
        return null;
    }

    public TaskResponse updateTask(UUID id, TaskRequest request, Authentication authentication) {
        return null;
    }

    public void deleteTask(UUID id, Authentication authentication) {
    }
}