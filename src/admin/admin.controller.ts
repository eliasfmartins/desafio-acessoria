import { 
  Controller, 
  Get, 
  Patch, 
  Param, 
  Body, 
  UseGuards,
  Delete,
  Post
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';

@Controller('admin')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('users')
  findAllUsers() {
    return this.adminService.findAllUsers();
  }

  @Get('tasks')
  findAllTasks() {
    return this.adminService.findAllTasks();
  }

  @Patch('users/:id/role')
  updateUserRole(
    @Param('id') id: string,
    @Body() body: { role: 'USER' | 'ADMIN' }
  ) {
    return this.adminService.updateUserRole(id, body.role);
  }

  @Delete('users/:id')
  deleteUser(@Param('id') id: string) {
    return this.adminService.deleteUser(id);
  }

  // Novas rotas para soft delete
  @Get('users/deleted')
  findDeletedUsers() {
    return this.adminService.findDeletedUsers();
  }

  @Get('tasks/deleted')
  findDeletedTasks() {
    return this.adminService.findDeletedTasks();
  }

  @Post('users/:id/restore')
  restoreUser(@Param('id') id: string) {
    return this.adminService.restoreUser(id);
  }

  @Post('tasks/:id/restore')
  restoreTask(@Param('id') id: string) {
    return this.adminService.restoreTask(id);
  }

  @Delete('users/:id/permanent')
  hardDeleteUser(@Param('id') id: string) {
    return this.adminService.hardDeleteUser(id);
  }

  @Delete('tasks/:id/permanent')
  hardDeleteTask(@Param('id') id: string) {
    return this.adminService.hardDeleteTask(id);
  }
}
