import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication;
  let authToken: string;
  let userId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Authentication', () => {
    it('should register a new user', async () => {
      const registerDto = {
        email: 'test@example.com',
        name: 'Test User',
        password: 'password123',
      };

      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(201);

      expect(response.body).toHaveProperty('access_token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe(registerDto.email);
      
      authToken = response.body.access_token;
      userId = response.body.user.id;
    });

    it('should login user', async () => {
      const loginDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginDto)
        .expect(201);

      expect(response.body).toHaveProperty('access_token');
      expect(response.body).toHaveProperty('user');
    });

    it('should get user profile', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('email');
      expect(response.body.email).toBe('test@example.com');
    });
  });

  describe('Tasks', () => {
    let taskId: string;

    it('should create a new task', async () => {
      const createTaskDto = {
        title: 'Test Task',
        description: 'Test Description',
        status: 'PENDING',
        priority: 'HIGH',
      };

      const response = await request(app.getHttpServer())
        .post('/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send(createTaskDto)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.title).toBe(createTaskDto.title);
      expect(response.body.status).toBe(createTaskDto.status);
      expect(response.body.priority).toBe(createTaskDto.priority);
      
      taskId = response.body.id;
    });

    it('should get all tasks', async () => {
      const response = await request(app.getHttpServer())
        .get('/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('tasks');
      expect(response.body).toHaveProperty('pagination');
      expect(Array.isArray(response.body.tasks)).toBe(true);
      expect(response.body.tasks.length).toBeGreaterThan(0);
    });

    it('should get a specific task', async () => {
      const response = await request(app.getHttpServer())
        .get(`/tasks/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('id');
      expect(response.body.id).toBe(taskId);
    });

    it('should update a task', async () => {
      const updateTaskDto = {
        status: 'IN_PROGRESS',
        priority: 'MEDIUM',
      };

      const response = await request(app.getHttpServer())
        .patch(`/tasks/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateTaskDto)
        .expect(200);

      expect(response.body.status).toBe(updateTaskDto.status);
      expect(response.body.priority).toBe(updateTaskDto.priority);
    });

    it('should soft delete a task', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/tasks/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body.canRestore).toBe(true);
    });

    it('should restore a soft deleted task', async () => {
      const response = await request(app.getHttpServer())
        .post(`/tasks/${taskId}/restore`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(201);

      expect(response.body).toHaveProperty('message');
    });
  });

  describe('Tags', () => {
    let tagId: string;

    it('should create a new tag', async () => {
      const createTagDto = {
        name: 'Test Tag',
        color: '#FF5733',
      };

      const response = await request(app.getHttpServer())
        .post('/tags')
        .set('Authorization', `Bearer ${authToken}`)
        .send(createTagDto)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe(createTagDto.name);
      expect(response.body.color).toBe(createTagDto.color);
      
      tagId = response.body.id;
    });

    it('should get all tags', async () => {
      const response = await request(app.getHttpServer())
        .get('/tags')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });

    it('should get a specific tag', async () => {
      const response = await request(app.getHttpServer())
        .get(`/tags/${tagId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('id');
      expect(response.body.id).toBe(tagId);
    });

    it('should update a tag', async () => {
      const updateTagDto = {
        color: '#00FF00',
      };

      const response = await request(app.getHttpServer())
        .patch(`/tags/${tagId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateTagDto)
        .expect(200);

      expect(response.body.color).toBe(updateTagDto.color);
    });
  });

  describe('Stats', () => {
    it('should get dashboard stats', async () => {
      const response = await request(app.getHttpServer())
        .get('/stats/dashboard')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('totalTasks');
      expect(response.body).toHaveProperty('tasksByStatus');
      expect(response.body).toHaveProperty('tasksByPriority');
      expect(response.body).toHaveProperty('overdueTasks');
      expect(response.body).toHaveProperty('completionRate');
    });
  });

  describe('Rate Limiting', () => {
    it('should apply rate limiting to auth endpoints', async () => {
      const loginDto = {
        email: 'wrong@example.com',
        password: 'wrongpassword',
      };

      // Make multiple requests to trigger rate limiting
      for (let i = 0; i < 5; i++) {
        await request(app.getHttpServer())
          .post('/auth/login')
          .send(loginDto)
          .expect(401);
      }

      // The 6th request should be rate limited
      await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginDto)
        .expect(429);
    });
  });
});
