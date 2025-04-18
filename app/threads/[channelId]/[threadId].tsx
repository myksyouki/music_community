import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform, Alert, PanResponder } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { IconButton, ActivityIndicator } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '../../../contexts/UserContext';
import { useData } from '../../../contexts/DataContext';
import { useSideMenu } from '../../../contexts/SideMenuContext';
import MusicGradientBackground from '../../../components/MusicGradientBackground';
import ThreadDetail, { ThreadDetailProps as ThreadProps } from '../../../components/ThreadDetail';
import ThreadComment, { ThreadCommentProps as CommentProps } from '../../../components/ThreadComment';
import CommentInput from '../../../components/CommentInput';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  increment, 
  serverTimestamp, 
  query, 
  where, 
  orderBy,
  Timestamp
} from 'firebase/firestore';
import { db, auth } from '../../../firebase/config';

// サンプルデータ（後で実装時に削除）
const SAMPLE_THREAD: ThreadProps = {
  id: '1',
  title: 'フルートの練習方法について',
  content: 'こんにちは！最近フルートを始めたばかりですが、効率的な練習方法があれば教えてください。特に息の使い方やロングトーンの練習法など興味があります。',
  author: {
    id: 'user1',
    name: '音楽初心者',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
  },
  createdAt: new Date(2023, 5, 15),
  channelId: '123',
  likes: 24,
  isLiked: false,
  commentCount: 5,
  tags: ['フルート', '初心者', '練習方法'],
};

const SAMPLE_COMMENTS: CommentProps[] = [
  {
    id: 'c1',
    content: 'フルート初心者なら、まずは正しい姿勢と唇の形から始めることをお勧めします。姿勢が悪いと音色や息の使い方に大きく影響します！',
    author: {
      id: 'user2',
      name: 'フルート講師',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    },
    createdAt: new Date(2023, 5, 16),
    likes: 12,
    isLiked: true,
    isThreadAuthor: false,
  },
  {
    id: 'c2',
    content: 'ロングトーンは毎日15分程度行うといいですよ。徐々に息を安定して出せるようになります。息を吸うときはお腹を膨らませるイメージで。',
    author: {
      id: 'user3',
      name: '音楽大学生',
      avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    },
    createdAt: new Date(2023, 5, 17),
    likes: 8,
    isLiked: false,
    replyToId: 'c1',
    replyToAuthor: 'フルート講師',
    isThreadAuthor: false,
  },
  {
    id: 'c3',
    content: 'みなさん、アドバイスありがとうございます！早速試してみます。',
    author: {
      id: 'user1',
      name: '音楽初心者',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    },
    createdAt: new Date(2023, 5, 18),
    likes: 4,
    isLiked: false,
    isThreadAuthor: true,
  },
];

// チャンネル情報のサンプル
const SAMPLE_CHANNEL = {
  id: '123',
  name: 'フルート愛好会'
};

// BreadcrumbNavigationコンポーネントを修正
const BreadcrumbNavigation = ({ 
  channelName, 
  threadTitle, 
  onNavigateHome,
  onNavigateChannel,
  onNavigateChannelList,
  router
}: { 
  channelName: string;
  threadTitle: string;
  onNavigateHome: () => void;
  onNavigateChannel: () => void;
  onNavigateChannelList: () => void;
  router: any;
}) => (
  <View style={styles.breadcrumbContainer}>
    <TouchableOpacity 
      style={styles.breadcrumbItem} 
      onPress={() => router.push('/')}
    >
      <Ionicons name="home-outline" size={16} color="#fff" />
      <Text style={styles.breadcrumbText}>HOME</Text>
    </TouchableOpacity>
    <Ionicons name="chevron-forward" size={16} color="rgba(255, 255, 255, 0.6)" />
    <TouchableOpacity style={styles.breadcrumbItem} onPress={onNavigateChannelList}>
      <Text style={styles.breadcrumbText}>チャンネル一覧</Text>
    </TouchableOpacity>
    <Ionicons name="chevron-forward" size={16} color="rgba(255, 255, 255, 0.6)" />
    <TouchableOpacity style={styles.breadcrumbItem} onPress={onNavigateChannel}>
      <Text style={styles.breadcrumbText}>{channelName}</Text>
    </TouchableOpacity>
    <Ionicons name="chevron-forward" size={16} color="rgba(255, 255, 255, 0.6)" />
    <View style={[styles.breadcrumbItem, styles.breadcrumbActive]}>
      <Text style={[styles.breadcrumbText, styles.breadcrumbActiveText]} numberOfLines={1}>
        {threadTitle}
      </Text>
    </View>
  </View>
);

// スレッド詳細画面
export default function ThreadDetailScreen() {
  const params = useLocalSearchParams();
  const channelId = typeof params.channelId === 'string' ? params.channelId : '';
  const threadId = typeof params.threadId === 'string' ? params.threadId : '';
  const categoryId = typeof params.categoryId === 'string' ? params.categoryId : '';
  const router = useRouter();
  const { userState } = useUser();
  const { openMenu } = useSideMenu();
  
  // 状態
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [thread, setThread] = useState<ThreadProps | null>(null);
  const [comments, setComments] = useState<CommentProps[]>([]);
  const [channel, setChannel] = useState<{ id: string; name: string; } | null>(null);
  const [replyingTo, setReplyingTo] = useState<{ id: string; authorName: string; } | null>(null);
  
  // テーマカラー
  const accentColor = '#6200ee'; // アクセントカラー（後で動的に変更できるように）
  
  // 右スワイプで戻るための処理を追加
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return gestureState.dx > 20 && Math.abs(gestureState.dy) < 20;
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx > 50) {
          router.back();
        }
      },
    })
  ).current;
  
  // データ読み込み
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const currentUser = auth.currentUser;
        
        // チャンネル情報を取得
        const channelRef = doc(db, `categories/${categoryId}/channels`, channelId as string);
        const channelSnap = await getDoc(channelRef);
        
        if (!channelSnap.exists()) {
          throw new Error('チャンネルが見つかりません');
        }
        
        const channelData = channelSnap.data();
        setChannel({ 
          id: channelId as string, 
          name: channelData.name 
        });
        
        // スレッド情報を取得
        const threadRef = doc(db, `categories/${categoryId}/threads`, threadId as string);
        const threadSnap = await getDoc(threadRef);
        
        if (!threadSnap.exists()) {
          throw new Error('スレッドが見つかりません');
        }
        
        const threadData = threadSnap.data();
        
        // いいね状態をチェック
        let isLiked = false;
        if (currentUser) {
          const likeRef = collection(db, `categories/${categoryId}/threads/${threadId}/likes`);
          const likeQuery = query(
            likeRef,
            where('userId', '==', currentUser.uid)
          );
          const likeSnap = await getDocs(likeQuery);
          isLiked = !likeSnap.empty;
        }
        
        // threadDataからThreadPropsに変換
        const threadProps: ThreadProps = {
          id: threadId as string,
          title: threadData.title,
          content: threadData.content,
          author: {
            id: threadData.authorId,
            name: threadData.authorName,
            avatar: threadData.authorAvatar || '',
          },
          createdAt: threadData.createdAt?.toDate() || new Date(),
          channelId: threadData.channelId,
          likes: threadData.likeCount || 0,
          isLiked: isLiked,
          commentCount: threadData.commentCount || 0,
          tags: threadData.tags || [],
          image: threadData.imageUrl || undefined,
        };
        
        setThread(threadProps);
        
        // コメントを取得
        const commentsRef = collection(db, `categories/${categoryId}/threads/${threadId}/comments`);
        const commentsQuery = query(
          commentsRef,
          orderBy('createdAt', 'asc')
        );
        const commentsSnap = await getDocs(commentsQuery);
        
        // コメントのデータを変換
        const commentsData: CommentProps[] = await Promise.all(
          commentsSnap.docs.map(async (doc) => {
            const data = doc.data();
            
            // いいね状態をチェック
            let commentIsLiked = false;
            if (currentUser) {
              const commentLikeRef = collection(db, `categories/${categoryId}/threads/${threadId}/comments/${doc.id}/likes`);
              const commentLikeQuery = query(
                commentLikeRef,
                where('userId', '==', currentUser.uid)
              );
              const commentLikeSnap = await getDocs(commentLikeQuery);
              commentIsLiked = !commentLikeSnap.empty;
            }
            
            return {
              id: doc.id,
              content: data.content,
              author: {
                id: data.authorId,
                name: data.authorName,
                avatar: data.authorAvatar || '',
              },
              createdAt: data.createdAt?.toDate() || new Date(),
              likes: data.likeCount || 0,
              isLiked: commentIsLiked,
              replyToId: data.replyToId || undefined,
              replyToAuthor: data.replyToAuthor || undefined,
              image: data.imageUrl || undefined,
              isThreadAuthor: data.authorId === threadData.authorId,
            };
          })
        );
        
        setComments(commentsData);
      } catch (error) {
        console.error('データ取得エラー:', error);
        Alert.alert(
          'エラー',
          'データの取得に失敗しました。'
        );
      } finally {
        setIsLoading(false);
      }
    };
    
    if (categoryId && channelId && threadId) {
      fetchData();
    }
  }, [categoryId, channelId, threadId]);
  
  // イベントハンドラ
  const handleBack = () => {
    router.back();
  };
  
  const handleNavigateHome = () => {
    router.push('/');
  };
  
  const handleNavigateChannel = () => {
    if (channelId) {
      router.push(`/channels/${channelId}`);
    }
  };
  
  const handleNavigateChannelList = () => {
    router.push('/channels');
  };
  
  const handleLikeThread = async () => {
    if (!thread) return;
    
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        Alert.alert('エラー', 'いいねするにはログインが必要です');
        return;
      }
      
      const threadRef = doc(db, `categories/${categoryId}/threads`, thread.id);
      const likesRef = collection(db, `categories/${categoryId}/threads/${thread.id}/likes`);
      const likeQuery = query(
        likesRef,
        where('userId', '==', currentUser.uid)
      );
      
      const likeSnap = await getDocs(likeQuery);
      
      if (likeSnap.empty) {
        // いいねを追加
        await addDoc(likesRef, {
          userId: currentUser.uid,
          createdAt: serverTimestamp()
        });
        
        await updateDoc(threadRef, {
          likeCount: increment(1)
        });
        
        setThread({
          ...thread,
          isLiked: true,
          likes: thread.likes + 1
        });
      } else {
        // いいねを削除
        const likeDoc = likeSnap.docs[0];
        const likeRef = doc(db, `categories/${categoryId}/threads/${thread.id}/likes`, likeDoc.id);
        
        await updateDoc(threadRef, {
          likeCount: increment(-1)
        });
        
        setThread({
          ...thread,
          isLiked: false,
          likes: thread.likes - 1
        });
      }
    } catch (error) {
      console.error('いいね処理エラー:', error);
      Alert.alert('エラー', 'いいね処理に失敗しました');
    }
  };
  
  const handleReplyThread = () => {
    // スレッドに直接返信する処理
    setReplyingTo(null); // 既存の返信をクリア
  };
  
  const handleShareThread = () => {
    // 共有処理
    Alert.alert('お知らせ', '共有機能は現在開発中です');
  };
  
  const handleReplyComment = (commentId: string, authorName: string) => {
    // コメントに返信する処理
    setReplyingTo({ id: commentId, authorName });
  };
  
  const handleLikeComment = async (commentId: string) => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        Alert.alert('エラー', 'いいねするにはログインが必要です');
        return;
      }
      
      const commentRef = doc(db, `categories/${categoryId}/threads/${threadId}/comments`, commentId);
      const commentLikesRef = collection(db, `categories/${categoryId}/threads/${threadId}/comments/${commentId}/likes`);
      const likeQuery = query(
        commentLikesRef,
        where('userId', '==', currentUser.uid)
      );
      
      const likeSnap = await getDocs(likeQuery);
      
      if (likeSnap.empty) {
        // いいねを追加
        await addDoc(commentLikesRef, {
          userId: currentUser.uid,
          createdAt: serverTimestamp()
        });
        
        await updateDoc(commentRef, {
          likeCount: increment(1)
        });
        
        setComments(prevComments => 
          prevComments.map(comment => {
            if (comment.id === commentId) {
              return {
                ...comment,
                isLiked: true,
                likes: comment.likes + 1
              };
            }
            return comment;
          })
        );
      } else {
        // いいねを削除
        const likeDoc = likeSnap.docs[0];
        const likeRef = doc(db, `categories/${categoryId}/threads/${threadId}/comments/${commentId}/likes`, likeDoc.id);
        
        await updateDoc(commentRef, {
          likeCount: increment(-1)
        });
        
        setComments(prevComments => 
          prevComments.map(comment => {
            if (comment.id === commentId) {
              return {
                ...comment,
                isLiked: false,
                likes: comment.likes - 1
              };
            }
            return comment;
          })
        );
      }
    } catch (error) {
      console.error('コメントいいね処理エラー:', error);
      Alert.alert('エラー', 'いいね処理に失敗しました');
    }
  };
  
  const handleShareComment = (commentId: string) => {
    // コメント共有処理
    Alert.alert('お知らせ', '共有機能は現在開発中です');
  };
  
  const handleCancelReply = () => {
    setReplyingTo(null);
  };
  
  const handleSendComment = async (text: string) => {
    if (!text.trim()) return;
    
    try {
      const currentUser = auth.currentUser;
      if (!currentUser || !thread) {
        Alert.alert('エラー', 'コメントを投稿するにはログインが必要です');
        return;
      }
      
      // コメントデータを作成
      const commentData: any = {
        threadId: thread.id,
        content: text.trim(),
        authorId: currentUser.uid,
        authorName: userState?.username || currentUser.displayName || 'Anonymous',
        authorAvatar: userState?.avatarUrl || currentUser.photoURL || '',
        createdAt: serverTimestamp(),
        likeCount: 0
      };
      
      // 返信の場合は返信先の情報を追加
      if (replyingTo) {
        commentData.replyToId = replyingTo.id;
        commentData.replyToAuthor = replyingTo.authorName;
      }
      
      // コメントをFirestoreに追加
      const commentsRef = collection(db, `categories/${categoryId}/threads/${thread.id}/comments`);
      const docRef = await addDoc(commentsRef, commentData);
      
      // スレッドのコメント数を更新
      const threadRef = doc(db, `categories/${categoryId}/threads`, thread.id);
      await updateDoc(threadRef, {
        commentCount: increment(1),
        lastActivity: serverTimestamp()
      });
      
      // 新しいコメントをUIに追加
      const newComment: CommentProps = {
        id: docRef.id,
        content: text.trim(),
        author: {
          id: currentUser.uid,
          name: userState?.username || currentUser.displayName || 'Anonymous',
          avatar: userState?.avatarUrl || currentUser.photoURL || '',
        },
        createdAt: new Date(),
        likes: 0,
        isLiked: false,
        isThreadAuthor: currentUser.uid === thread.author.id,
        ...(replyingTo && { 
          replyToId: replyingTo.id,
          replyToAuthor: replyingTo.authorName
        })
      };
      
      setComments(prev => [...prev, newComment]);
      setReplyingTo(null);
      
      // スレッドのコメント数をUIで更新
      if (thread) {
        setThread({
          ...thread,
          commentCount: thread.commentCount + 1
        });
      }
    } catch (error) {
      console.error('コメント投稿エラー:', error);
      Alert.alert('エラー', 'コメントの投稿に失敗しました');
    }
  };
  
    return (
    <MusicGradientBackground theme="default" opacity={0.98}>
            <SafeAreaView style={styles.container} {...panResponder.panHandlers}>
              <StatusBar style="light" />
              
        {/* ヘッダー */}
              <View style={styles.header}>
                <IconButton
            icon="menu"
            iconColor="#fff"
                  size={24}
            onPress={openMenu}
          />
          <Text style={styles.headerTitle}>スレッド詳細</Text>
          <IconButton
            icon="notifications-outline"
            size={24}
            iconColor="#fff"
            onPress={() => {}}
          />
        </View>
        
        {/* パンくずリスト */}
        {channel && thread && (
          <BreadcrumbNavigation 
            channelName={channel.name}
            threadTitle={thread.title}
            onNavigateHome={handleNavigateHome}
            onNavigateChannel={handleNavigateChannel}
            onNavigateChannelList={handleNavigateChannelList}
            router={router}
          />
        )}
        
        {/* ローディング表示 */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#6200ee" />
            <Text style={styles.loadingText}>読み込み中...</Text>
          </View>
        ) : thread ? (
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={{ flex: 1 }}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
          >
            <ScrollView 
              style={styles.scrollView}
              contentContainerStyle={styles.scrollViewContent}
            >
              {/* スレッド本文 */}
              <ThreadDetail
                {...thread}
                onLike={handleLikeThread}
                onReply={handleReplyThread}
                onShare={handleShareThread}
                accentColor={accentColor}
              />
              
              {/* コメントセクション */}
              <View style={styles.commentsSection}>
                <Text style={styles.commentsSectionTitle}>
                  コメント {comments.length > 0 ? `(${comments.length})` : ''}
                </Text>
                
                {comments.map((comment) => (
                  <ThreadComment
                    key={comment.id}
                    {...comment}
                    onLike={() => handleLikeComment(comment.id)}
                    onReply={() => handleReplyComment(comment.id, comment.author.name)}
                    onShare={() => handleShareComment(comment.id)}
                    accentColor={accentColor}
                    allComments={comments}
                  />
                ))}
                
                {comments.length === 0 && (
                  <View style={styles.emptyComments}>
                    <Text style={styles.emptyCommentsText}>
                      まだコメントがありません。最初のコメントを投稿してみましょう！
                    </Text>
                  </View>
                )}
              </View>
            </ScrollView>
            
            {/* コメント入力 */}
            <CommentInput
              onSend={handleSendComment}
              replyingTo={replyingTo}
              onCancel={handleCancelReply}
              placeholder={
                replyingTo
                  ? `@${replyingTo.authorName}に返信`
                  : 'コメントを入力...'
              }
            />
          </KeyboardAvoidingView>
        ) : (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={64} color="#fff" />
            <Text style={styles.errorText}>{error || 'スレッドの読み込みに失敗しました'}</Text>
          </View>
        )}
            </SafeAreaView>
    </MusicGradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 60,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    padding: 16,
    paddingBottom: 32,
  },
  commentsSection: {
    marginTop: 16,
  },
  commentsSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  emptyComments: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: 'rgba(30, 30, 30, 0.7)',
    borderRadius: 12,
  },
  emptyCommentsText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    color: '#fff',
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    marginTop: 16,
    color: '#FFFFFF',
    fontSize: 18,
    textAlign: 'center',
  },
  breadcrumbContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  breadcrumbItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 4,
  },
  breadcrumbText: {
    marginLeft: 4,
    color: '#FFFFFF',
    fontSize: 16,
  },
  breadcrumbActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 4,
  },
  breadcrumbActiveText: {
    fontWeight: 'bold',
  },
}); 