const UserModel = require('../models/user-model');
const bcrypt = require('bcrypt');
const uuid = require('uuid');
const mailService = require('./mail-service');
const tokenService = require('./token-service');
const UserDto = require('../dtos/user-dto');
const ApiError = require('../errors/api-error');

class UserService {
  async register(email, password) {
    const candidate = await UserModel.findOne({ email });

    if (candidate) {
      throw ApiError.BadRequest(`Пользователь с email ${email} уже существует`);
    }

    const hashedPassword = await bcrypt.hash(password, 3);
    const activationLink = uuid.v4();

    //сохраняем в бд пользователя
    const user = await UserModel.create({
      email,
      password: hashedPassword,
      activationLink,
    });

    await mailService.sendActivationMail(
      email,
      `${process.env.API_URL}/activate/${activationLink}`,
    );

    const userDto = new UserDto(user);
    const tokens = tokenService.generateTokens({ ...userDto });

    await tokenService.saveToken(userDto.id, tokens.refreshToken);

    return {
      ...tokens,
      user: userDto,
    };
  }

  async activate(activationLink) {
    const user = await UserModel.findOne({ activationLink });
    if (!user) {
      throw ApiError.BadRequest('Некорректная ссылка активации');
    }
    user.isActivated = true;
    await user.save();
  }

  async login(email, password) {
    const user = await UserModel.findOne({ email });
    if (!user) {
      throw ApiError.BadRequest(`Пользователь с email ${email} не найден`);
    }

    // сравниваем пароли
    const isPasswordEquals = await bcrypt.compare(password, user.password);
    if (!isPasswordEquals) {
      throw ApiError.BadRequest('Неверный пароль');
    }
    const userDto = new UserDto(user);
    const tokens = tokenService.generateTokens({ ...userDto });
    await tokenService.saveToken(userDto.id, tokens.refreshToken);

    return {
      ...tokens,
      user: userDto,
    };
  }
}

module.exports = new UserService();
