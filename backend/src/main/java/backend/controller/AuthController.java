package backend.controller;

import backend.dto.ApiResponse;
import backend.dto.AuthResponse;
import backend.dto.RegisterRequest;
import backend.service.AuthService;
import jakarta.validation.Valid;
import org.apache.coyote.BadRequestException;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RequestMapping("api/auth/v1")
@RestController
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }
    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthResponse>> register(@Valid @RequestBody RegisterRequest request) throws BadRequestException {
        AuthResponse response = authService.register(request);
        return ResponseEntity.status(201).body(ApiResponse.ok("User registered successfully", response));
    }
}
