import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException, Param } from '@nestjs/common';
import { CreatePokemonDto } from './dto/create-pokemon.dto';
import { UpdatePokemonDto } from './dto/update-pokemon.dto';
import { Model, isValidObjectId } from 'mongoose';
import { Pokemon } from './entities/pokemon.entity';
import { InjectModel } from '@nestjs/mongoose';

@Injectable()
export class PokemonService {
  constructor(
    @InjectModel(Pokemon.name)
    private readonly pokemonModel: Model<Pokemon>
  ){}
  async create(createPokemonDto: CreatePokemonDto) {
    createPokemonDto.name = createPokemonDto.name.toLowerCase();  
    try {
      const newPokemon = await this.pokemonModel.create(createPokemonDto);
      return newPokemon;
    } catch (error) {
      this.handleException(error);
    }
    

  }

  async findAll() {
    try {
      const pokemos = await this.pokemonModel.find();
      if(pokemos.length < 1)throw new Error('404-db');
      return pokemos;
    } catch (error) {
      this.handleException(error);
    }
  }

  async findOne(param: string) {
    let pokemon: Pokemon;
   
    try {
      if(isValidObjectId(param)){
        pokemon = await this.pokemonModel.findById(param);
      }else if(!isNaN(parseInt(param))){
        pokemon = await this.pokemonModel.findOne({nu: param});
      }else{
        pokemon = await this.pokemonModel.findOne({name: param.toLowerCase().trim()})
      }
      if(pokemon === null) throw new Error('404')
      return pokemon;
    } catch (error) {
     
      this.handleException(error, param);
    }
    
  }

  async update(param: string, updatePokemonDto: UpdatePokemonDto) {
    let pokemon = await this.findOne(param);
    try {
      if(updatePokemonDto.name) updatePokemonDto.name = updatePokemonDto.name.toLowerCase();

      await pokemon.updateOne(updatePokemonDto, {new: true});
      
      return {...pokemon.toJSON(), ...updatePokemonDto};
      
    } catch (error) {
      this.handleException(error);
    }
  }

  async remove(id: string) {
   
    try {
      let rerult = await this.pokemonModel.findByIdAndDelete(id);
      if(!rerult) throw new Error('404');
      
    } catch (error) {
      this.handleException(error, id)
    }
  }

  handleException(error: any, param?: any) {
    console.log(error)
    if(error.code === 11000){
      throw new BadRequestException(`Pokemon already exist in DB [${JSON.stringify(error.keyValue)}]`)
    }
    else if(error.message === '404-db'){
      throw new NotFoundException(`Pokemons Not Found in DB!`);
    }
    else if(error.message === '404'){
      throw new NotFoundException(`Pokemon with param: [${param}] Not Found!`);
    }
    throw new InternalServerErrorException(`Internal error, plesae check server logs`)
  }
}
