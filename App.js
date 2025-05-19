import React, { useState, useEffect, useRef, createContext, useContext, useCallback, useMemo, useLayoutEffect } from 'react';
import { StyleSheet, Text, View, FlatList, TextInput, TouchableOpacity, Modal } from 'react-native';
import { NavigationContainer, useNavigation } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/Feather';

const TarefasContext = createContext();

function TarefasProvider({ children }) {
  const [tarefas, setTarefas] = useState([
    { id: '1', texto: 'Tarefa inicial 1', descricao: 'Descrição da tarefa inicial 1', concluida: false },
    { id: '2', texto: 'Tarefa inicial 2', descricao: 'Descrição da tarefa inicial 2', concluida: true },
  ]);

  const adicionarTarefaContext = (novaTarefa) => {
    setTarefas([...tarefas, { id: Date.now().toString(), ...novaTarefa, concluida: false }]);
  };

  const removerTarefaContext = (id) => {
    setTarefas(tarefas.filter(tarefa => tarefa.id !== id));
  };

  const atualizarTarefaContext = (id, updates) => {
    setTarefas(tarefas.map(tarefa =>
      tarefa.id === id ? { ...tarefa, ...updates } : tarefa
    ));
  };

  return (
    <TarefasContext.Provider value={{ tarefas, adicionarTarefaContext, removerTarefaContext, atualizarTarefaContext }}>
      {children}
    </TarefasContext.Provider>
  );
}

function ListaTarefasScreen() {
  const { tarefas, adicionarTarefaContext, removerTarefaContext, atualizarTarefaContext } = useContext(TarefasContext);
  const [novaTarefaTexto, setNovaTarefaTexto] = useState('');
  const [novaTarefaDescricao, setNovaTarefaDescricao] = useState('');
  const inputRef = useRef(null);
  const navigation = useNavigation();
  const [tarefaParaRemover, setTarefaParaRemover] = useState(null);
  const [modalVisivel, setModalVisivel] = useState(false);

  useEffect(() => {
    console.log('Componente ListaTarefasScreen montado');
    if (inputRef.current) {
      inputRef.current.focus();
    }
    const timer = setTimeout(() => {
      adicionarTarefaContext({ texto: 'Tarefa carregada (via useEffect)', descricao: 'Esta tarefa foi carregada após 30 segundos.' });
    }, 30000);
    return () => clearTimeout(timer);
  }, [adicionarTarefaContext]);

  const adicionarTarefa = useCallback(() => {
    if (novaTarefaTexto.trim()) {
      adicionarTarefaContext({ texto: novaTarefaTexto, descricao: novaTarefaDescricao });
      setNovaTarefaTexto('');
      setNovaTarefaDescricao('');
      if (inputRef.current) {
        inputRef.current.blur();
      }
    }
  }, [novaTarefaTexto, novaTarefaDescricao, adicionarTarefaContext, inputRef]);

  const numeroDeTarefasConcluidas = useMemo(() => {
    console.log('Calculando o número de tarefas concluídas...');
    return tarefas.filter(tarefa => tarefa.concluida).length;
  }, [tarefas]);

  const navegarParaDetalhes = (tarefa) => {
    navigation.navigate('Detalhes', { tarefa });
  };

  const confirmarRemocao = (tarefa) => {
    setTarefaParaRemover(tarefa);
    setModalVisivel(true);
  };

  const removerTarefa = () => {
    if (tarefaParaRemover) {
      removerTarefaContext(tarefaParaRemover.id);
      setTarefaParaRemover(null);
      setModalVisivel(false);
    }
  };

  const cancelarRemocao = () => {
    setTarefaParaRemover(null);
    setModalVisivel(false);
  };

  const toggleConcluida = (id) => {
    atualizarTarefaContext(id, { concluida: !tarefas.find(tarefa => tarefa.id === id).concluida });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Lista TOP de tarefas ({tarefas.length})</Text>
      <Text style={styles.subtitulo}>Completo: {numeroDeTarefasConcluidas}</Text>
      <View style={styles.inputContainer}>
        <TextInput
          style={[styles.input, { flex: 2 }]}
          placeholder="Nova Tarefa"
          value={novaTarefaTexto}
          onChangeText={text => setNovaTarefaTexto(text)}
          ref={inputRef}
          placeholderTextColor="#888"
        />
        <TextInput
          style={[styles.input, { flex: 3, marginLeft: 10 }]}
          placeholder="Descrição (opcional)"
          value={novaTarefaDescricao}
          onChangeText={text => setNovaTarefaDescricao(text)}
          placeholderTextColor="#888"
        />
        <TouchableOpacity style={styles.addButton} onPress={adicionarTarefa}>
          <Text style={styles.addButtonText}>Adicionar</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={tarefas}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.itemContainer}>
            <TouchableOpacity style={[styles.item, item.concluida ? styles.itemConcluida : {}]} onPress={() => navegarParaDetalhes(item)}>
              <Icon name={item.concluida ? "check-square" : "square"} size={24} color={item.concluida ? "#4CAF50" : "#E0F2F7"} onPress={() => toggleConcluida(item.id)} />
              <Text style={[styles.textoTarefa, item.concluida ? styles.textoTarefaConcluida : {}]}>{item.texto}</Text>
              {item.descricao && <Text style={styles.descricaoTarefa}>{item.descricao}</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={styles.removerBotao} onPress={() => confirmarRemocao(item)}>
              <Icon name="trash-2" size={20} color="#FF6B6B" />
            </TouchableOpacity>
          </View>
        )}
      />

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisivel}
        onRequestClose={cancelarRemocao}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalView}>
            <Text style={styles.modalTitulo}>Remover tarefa</Text>
            <Text style={styles.modalTexto}>Você tem certeza que quer remover a "{tarefaParaRemover?.texto}"?</Text>
            <View style={styles.modalBotoes}>
              <TouchableOpacity style={[styles.modalBotao, styles.botaoCancelar]} onPress={cancelarRemocao}>
                <Text style={styles.textoBotao}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBotao, styles.botaoRemover]} onPress={removerTarefa}>
                <Text style={styles.textoBotao}>Remover</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function DetalhesTarefaScreen({ route }) {
  const { tarefa } = route.params;
  const navigation = useNavigation();
  const { atualizarTarefaContext } = useContext(TarefasContext);
  const [descricao, setDescricao] = useState(tarefa.descricao || '');

  useEffect(() => {
    navigation.setOptions({ title: `Detalhes da Tarefa: ${tarefa.texto}` });
    console.log('useEffect em DetalhesTarefaScreen');
    return () => console.log('Cleanup do useEffect em DetalhesTarefaScreen');
  }, [navigation, tarefa.texto]);

  useLayoutEffect(() => {
    console.log('useLayoutEffect em DetalhesTarefaScreen');
    return () => console.log('Cleanup do useLayoutEffect em DetalhesTarefaScreen');
  }, [tarefa]);

  const salvarDescricao = useCallback(() => {
    atualizarTarefaContext(tarefa.id, { descricao });
    navigation.goBack();
  }, [atualizarTarefaContext, tarefa.id, descricao, navigation]);

  return (
    <View style={styles.container}>
      <Text style={styles.textoDetalhesTitulo}>{tarefa.texto}</Text>
      <TextInput
        style={styles.inputDetalhes}
        multiline
        placeholder="Adicionar a descrição..."
        value={descricao}
        onChangeText={setDescricao}
        placeholderTextColor="#888"
      />
      <TouchableOpacity style={styles.salvarBotao} onPress={salvarDescricao}>
        <Text style={styles.salvarTexto}>Salvar a descrição</Text>
      </TouchableOpacity>
    </View>
  );
}

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <TarefasProvider>
        <Stack.Navigator screenOptions={{
          headerStyle: { backgroundColor: '#1E272E' },
          headerTintColor: '#A7B1BD',
          headerTitleStyle: { fontWeight: 'bold' },
        }}>
          <Stack.Screen name="Lista" component={ListaTarefasScreen} options={{ title: 'Task Matrix' }} />
          <Stack.Screen name="Detalhes" component={DetalhesTarefaScreen} />
        </Stack.Navigator>
      </TarefasProvider>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#14181C',
  },
  titulo: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#00D4FF',
    textAlign: 'center',
    textShadowColor: '#00A3CC',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitulo: {
    fontSize: 18,
    color: '#A7B1BD',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    marginBottom: 25,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#2C3A47',
    padding: 2,
    alignItems: 'center',
  },
  input: {
    padding: 15,
    fontSize: 16,
    color: '#E0F2F7',
  },
  addButton: {
    backgroundColor: '#03A9F4',
    padding: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  item: {
    flex: 1,
    backgroundColor: '#1E272E',
    padding: 18,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2C3A47',
    shadowColor: '#00D4FF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemConcluida: {
    backgroundColor: '#2E352E',
    borderColor: '#4CAF50',
  },
  textoTarefa: {
    fontSize: 17,
    color: '#E0F2F7',
    marginLeft: 10,
  },
  textoTarefaConcluida: {
    color: '#4CAF50',
    textDecorationLine: 'line-through',
  },
  descricaoTarefa: {
    fontSize: 14,
    color: '#A7B1BD',
    marginTop: 5,
    padding: 10,
  },
  removerBotao: {
    padding: 10,
    marginLeft: 10,
  },
  textoDetalhesTitulo: {  
    fontSize: 24,
    color: '#00D4FF',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 15,
    fontWeight: 'bold',
    textShadowColor: '#00A3CC',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  textoDetalhes: {
    fontSize: 20,
    color: '#00D4FF',
    textAlign: 'center',
    marginTop: 20,
    textShadowColor: '#00A3CC',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  inputDetalhes: {
    backgroundColor: '#2A2A3D',
    color: '#FFF',
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#00D4FF',
    fontSize: 16,
    marginTop: 20,
    marginBottom: 20,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  salvarBotao: {
    backgroundColor: '#00D4FF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  salvarTexto: {
    color: '#14181C',
    fontWeight: 'bold',
    fontSize: 18,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    backgroundColor: '#2C3A47',
    borderRadius: 10,
    padding: 25,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitulo: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FF6B6B',
    marginBottom: 15,
  },
  modalTexto: {
    fontSize: 18,
    color: '#E0F2F7',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalBotoes: {
    flexDirection: 'row',
  },
  modalBotao: {
    borderRadius: 8,
    padding: 10,
    marginHorizontal: 10,
    alignItems: 'center',
    flex: 1,
  },
  botaoCancelar: {
    backgroundColor: '#A7B1BD',
  },
  botaoRemover: {
    backgroundColor: '#FF6B6B',
  },
  textoBotao: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
});