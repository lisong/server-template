import { RedlockService } from '@anchan828/nest-redlock';
import { Controller, Get, Request, UseGuards } from '@nestjs/common';
import { MenuService } from './menu.service';
import { Public } from 'src/common/decorators/public.decorator';
import { AdminJwtAuthAllowedGuard } from '../guards/admin-jwt-auth-allowed.guard';

@Controller('admin/menu')
export class MenuController {
  constructor(
    private readonly redlockService: RedlockService,
    private readonly menuService: MenuService,
  ) {}

  @Public()
  @UseGuards(AdminJwtAuthAllowedGuard)
  @Get()
  async menu(@Request() req): Promise<any> {
    const userId = req.user.id;
    const menus = await this.menuService.getUserMenuFormat(userId);
    return {
      menus,
    };
  }

  @Get('apiRouter/list')
  async apiRouterList() {
    const items = await this.menuService.getAllApiRouter();
    return {
      items,
    };
  }

  @Get('all/tree')
  async getAllMenu() {
    const menu = await this.menuService.getAllMenu();
    return {
      menu: this.menuService.buildTree(menu),
    };
  }
}
