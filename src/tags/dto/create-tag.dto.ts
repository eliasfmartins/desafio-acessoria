import { IsString, MinLength, IsHexColor } from 'class-validator';

export class CreateTagDto {
  @IsString()
  @MinLength(1)
  name: string;

  @IsString()
  @IsHexColor()
  color: string;
}

