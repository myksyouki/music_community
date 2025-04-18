import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Card, Divider, List, Switch, IconButton } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useUser } from '../contexts/UserContext';
import { userService } from '../firebase/services';
import { useFirebase } from '../contexts/FirebaseContext';

// 設定項目の型定義
type SettingItemBase = {
  title: string;
  icon: string;
};

type SwitchSettingItem = SettingItemBase & {
  type: 'switch';
  value: boolean;
  onValueChange: (value: boolean) => void;
};

type NavigateSettingItem = SettingItemBase & {
  type: 'navigate';
  onPress: () => void;
  rightText?: string;
  textColor?: string;
};

type InfoSettingItem = SettingItemBase & {
  type: 'info';
  rightText: string;
};

type SettingItem = SwitchSettingItem | NavigateSettingItem | InfoSettingItem;

type SettingSection = {
  title: string;
  items: SettingItem[];
};

export default function SettingsScreen() {
  const router = useRouter();
  const { userState, setDarkMode, setNotifications, setFabEnabled, updateProfile } = useUser();
  const { darkMode: userDarkMode, notifications: userNotifications, fabEnabled: userFabEnabled } = userState;
  const { user } = useFirebase();
  const [isSaving, setIsSaving] = useState<boolean>(false);
  
  // ユーザー設定をFirestoreから読み込む
  useEffect(() => {
    const loadUserSettings = async () => {
      if (!user || !user.id) return;
      
      try {
        const userSettings = await userService.getUserSettings(user.id);
        if (userSettings) {
          // 設定をコンテキストに反映
          updateProfile({
            darkMode: userSettings.darkMode ?? userDarkMode,
            notifications: userSettings.notifications ?? userNotifications,
            fabEnabled: userSettings.fabEnabled ?? userFabEnabled
          });
        }
      } catch (error) {
        console.error('設定の読み込みに失敗しました:', error);
      }
    };
    
    loadUserSettings();
  }, [user]);
  
  // 設定の変更をFirestoreに保存する関数
  const saveSettings = async (key: string, value: any) => {
    if (!user || !user.id) return;
    
    setIsSaving(true);
    try {
      await userService.updateUserSettings(user.id, { [key]: value });
      console.log(`設定を保存しました: ${key} = ${value}`);
    } catch (error) {
      console.error('設定の保存に失敗しました:', error);
      Alert.alert('エラー', '設定の保存に失敗しました。ネットワーク接続を確認してください。');
    } finally {
      setIsSaving(false);
    }
  };
  
  // ダークモード設定変更時
  const handleDarkModeChange = (value: boolean) => {
    setDarkMode(value);
    saveSettings('darkMode', value);
  };
  
  // 通知設定変更時
  const handleNotificationsChange = (value: boolean) => {
    setNotifications(value);
    saveSettings('notifications', value);
  };
  
  // 音楽メニューボタン設定変更時
  const handleFabEnabledChange = (value: boolean) => {
    setFabEnabled(value);
    saveSettings('fabEnabled', value);
  };
  
  // 設定項目のセクション
  const settingSections: SettingSection[] = [
    {
      title: 'アプリ設定',
      items: [
        {
          title: 'ダークモード',
          icon: 'moon',
          type: 'switch',
          value: userDarkMode,
          onValueChange: handleDarkModeChange,
        },
        {
          title: '通知',
          icon: 'notifications',
          type: 'switch',
          value: userNotifications,
          onValueChange: handleNotificationsChange,
        },
        {
          title: '音楽メニューボタン',
          icon: 'musical-notes',
          type: 'switch',
          value: userFabEnabled,
          onValueChange: handleFabEnabledChange,
        },
        {
          title: '言語',
          icon: 'language',
          type: 'navigate',
          onPress: () => Alert.alert('言語設定', '現在は日本語のみ対応しています'),
          rightText: '日本語',
        },
        {
          title: 'フォントサイズ',
          icon: 'text',
          type: 'navigate',
          onPress: () => Alert.alert('フォントサイズ', 'フォントサイズの設定は開発中です'),
          rightText: '標準',
        },
      ],
    },
    {
      title: 'アカウント設定',
      items: [
        {
          title: 'プライバシー設定',
          icon: 'lock-closed',
          type: 'navigate',
          onPress: () => Alert.alert('プライバシー設定', 'プライバシー設定は開発中です'),
        },
        {
          title: 'ブロックしたユーザー',
          icon: 'person-remove',
          type: 'navigate',
          onPress: () => Alert.alert('ブロックしたユーザー', 'ブロック機能は開発中です'),
        },
        {
          title: 'データのダウンロード',
          icon: 'download',
          type: 'navigate',
          onPress: () => Alert.alert('データのダウンロード', 'データのダウンロード機能は開発中です'),
        },
        {
          title: 'アカウント削除',
          icon: 'trash',
          type: 'navigate',
          onPress: () => Alert.alert('アカウント削除', 'アカウント削除機能は開発中です'),
          textColor: '#FF3D3D',
        },
      ],
    },
    {
      title: 'サポート',
      items: [
        {
          title: 'ヘルプセンター',
          icon: 'help-circle',
          type: 'navigate',
          onPress: () => Alert.alert('ヘルプセンター', 'ヘルプセンターは開発中です'),
        },
        {
          title: 'お問い合わせ',
          icon: 'mail',
          type: 'navigate',
          onPress: () => Alert.alert('お問い合わせ', 'お問い合わせ機能は開発中です'),
        },
        {
          title: '利用規約',
          icon: 'document-text',
          type: 'navigate',
          onPress: () => Alert.alert('利用規約', '利用規約は開発中です'),
        },
        {
          title: 'プライバシーポリシー',
          icon: 'shield',
          type: 'navigate',
          onPress: () => Alert.alert('プライバシーポリシー', 'プライバシーポリシーは開発中です'),
        },
      ],
    },
    {
      title: 'アプリ情報',
      items: [
        {
          title: 'バージョン',
          icon: 'information-circle',
          type: 'info',
          rightText: '1.0.0',
        },
        {
          title: 'アプリを評価する',
          icon: 'star',
          type: 'navigate',
          onPress: () => Alert.alert('アプリを評価する', 'App Storeでの評価機能は開発中です'),
        },
      ],
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar style="light" />
      
      <View style={styles.header}>
        <IconButton
          icon="arrow-left"
          size={24}
          iconColor="#FFFFFF"
          onPress={() => router.back()}
          style={styles.backButton}
        />
        <Text style={styles.headerTitle}>設定</Text>
        <View style={{ width: 40 }} />
      </View>
      
      <ScrollView style={styles.scrollView}>
        {settingSections.map((section, sectionIndex) => (
          <Card key={sectionIndex} style={styles.sectionCard}>
            <Card.Title title={section.title} titleStyle={styles.sectionTitle} />
            <Card.Content>
              {section.items.map((item, itemIndex) => (
                <React.Fragment key={itemIndex}>
                  {itemIndex > 0 && <Divider style={styles.divider} />}
                  <List.Item
                    title={item.title}
                    titleStyle={[
                      styles.itemTitle,
                      'textColor' in item && item.textColor ? { color: item.textColor } : null
                    ]}
                    left={props => (
                      <List.Icon
                        {...props}
                        icon={item.icon}
                        color={'textColor' in item && item.textColor ? item.textColor : '#FFFFFF'}
                      />
                    )}
                    right={props => {
                      if (item.type === 'switch') {
                        return (
                          <Switch
                            value={item.value}
                            onValueChange={item.onValueChange}
                            color="#7F3DFF"
                          />
                        );
                      } else if (item.type === 'navigate') {
                        return (
                          <View style={styles.rightContainer}>
                            {item.rightText && (
                              <Text style={styles.rightText}>{item.rightText}</Text>
                            )}
                            <List.Icon {...props} icon="chevron-forward" />
                          </View>
                        );
                      } else if (item.type === 'info') {
                        return (
                          <Text style={styles.rightText}>{item.rightText}</Text>
                        );
                      }
                      return null;
                    }}
                    onPress={item.type === 'navigate' ? item.onPress : undefined}
                  />
                </React.Fragment>
              ))}
            </Card.Content>
          </Card>
        ))}
        
        <Button 
          mode="outlined" 
          style={styles.logoutButton}
          textColor="#FF3D3D"
          onPress={() => {
            Alert.alert(
              'ログアウト',
              'ログアウトしますか？',
              [
                {
                  text: 'キャンセル',
                  style: 'cancel',
                },
                {
                  text: 'ログアウト',
                  onPress: async () => {
                    try {
                      // Firebase auth.tsからimportしたsignOut関数を使用してログアウト
                      const { auth } = require('../firebase/config');
                      const { signOut } = require('firebase/auth');
                      await signOut(auth);
                      
                      // ログアウト後はログイン画面に移動
                      router.replace('/login');
                    } catch (error) {
                      console.error('ログアウトエラー:', error);
                      Alert.alert('エラー', 'ログアウトに失敗しました。もう一度お試しください。');
                    }
                  },
                  style: 'destructive',
                },
              ]
            );
          }}
        >
          ログアウト
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  backButton: {
    margin: 0,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  sectionCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    marginBottom: 16,
    elevation: 0,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 18,
  },
  divider: {
    backgroundColor: '#2A2A2A',
  },
  itemTitle: {
    color: '#FFFFFF',
  },
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rightText: {
    color: '#AAAAAA',
    marginRight: 8,
  },
  logoutButton: {
    marginVertical: 24,
    borderColor: '#FF3D3D',
    borderRadius: 8,
  },
}); 