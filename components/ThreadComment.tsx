import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Avatar, IconButton, Badge } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { formatDistanceToNow } from 'date-fns';
import { ja } from 'date-fns/locale';

// コメントの型定義
export interface ThreadCommentProps {
  id: string;
  content: string;
  author: {
    id: string;
    name: string;
    avatar: string;
  };
  createdAt: Date;
  likes: number;
  isLiked: boolean;
  replyToId?: string;
  replyToAuthor?: string;
  image?: string;
  isThreadAuthor: boolean;
}

// コメントの表示用Props
export interface ThreadCommentViewProps extends ThreadCommentProps {
  onLike: () => void;
  onReply: () => void;
  onShare: () => void;
  accentColor: string;
  allComments: ThreadCommentProps[];
  isLastComment?: boolean;
}

// 相対時間を計算する関数
const getRelativeTime = (date: Date): string => {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) {
    return `${days}日前`;
  } else if (hours > 0) {
    return `${hours}時間前`;
  } else if (minutes > 0) {
    return `${minutes}分前`;
  } else {
    return 'たった今';
  }
};

const ThreadComment = ({
  id,
  content,
  author,
  createdAt,
  likes,
  isLiked,
  replyToId,
  replyToAuthor,
  image,
  isThreadAuthor,
  onLike,
  onReply,
  onShare,
  accentColor,
  allComments,
  isLastComment = false
}: ThreadCommentViewProps) => {
  // 返信先のコメントを取得
  const replyToComment = replyToId 
    ? allComments.find(c => c.id === replyToId) 
    : null;

  // 日付をフォーマット
  const formattedDate = getRelativeTime(new Date(createdAt));

  return (
    <View style={[
      styles.container,
      isLastComment && styles.lastComment,
      isThreadAuthor && styles.authorComment
    ]}>
      <Avatar.Image 
        size={36} 
        source={{ uri: author.avatar }} 
      />
      
      <View style={styles.contentContainer}>
        <View style={styles.header}>
          <View style={styles.authorInfo}>
            <Text style={styles.authorName}>{author.name}</Text>
            {isThreadAuthor && (
              <Badge style={[styles.authorBadge, { backgroundColor: accentColor }]}>投稿者</Badge>
            )}
          </View>
          <Text style={styles.date}>{formattedDate}</Text>
        </View>
        
        {/* 返信元コメント */}
        {replyToComment && (
          <TouchableOpacity style={styles.replyToContainer}>
            <View style={[styles.replyToBar, { backgroundColor: accentColor }]} />
            <View style={styles.replyToContent}>
              <Text style={styles.replyToAuthor}>{replyToComment.author.name}</Text>
              <Text style={styles.replyToText} numberOfLines={1}>{replyToComment.content}</Text>
            </View>
          </TouchableOpacity>
        )}
        
        <Text style={styles.content}>{content}</Text>
        
        {image && (
          <Image 
            source={{ uri: image }} 
            style={styles.image}
            resizeMode="cover"
          />
        )}
        
        <View style={styles.actions}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={onLike}
          >
            <Ionicons 
              name={isLiked ? "heart" : "heart-outline"} 
              size={16} 
              color={isLiked ? accentColor : "#AAAAAA"} 
            />
            <Text 
              style={[
                styles.actionText,
                isLiked ? { color: accentColor } : {}
              ]}
            >
              {likes || 0}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={onReply}
          >
            <Ionicons name="chatbubble-outline" size={16} color="#AAAAAA" />
            <Text style={styles.actionText}>返信</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={onShare}
          >
            <Ionicons name="share-outline" size={16} color="#AAAAAA" />
            <Text style={styles.actionText}>共有</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  lastComment: {
    marginBottom: 40,
  },
  authorComment: {
    // 投稿者のコメントは少しハイライト
  },
  contentContainer: {
    flex: 1,
    marginLeft: 12,
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  authorName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  authorBadge: {
    fontSize: 10,
    marginLeft: 6,
    paddingHorizontal: 6,
    height: 18,
  },
  date: {
    fontSize: 12,
    color: '#AAAAAA',
  },
  content: {
    fontSize: 14,
    color: '#FFFFFF',
    lineHeight: 20,
  },
  image: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    marginTop: 8,
  },
  actions: {
    flexDirection: 'row',
    marginTop: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  actionText: {
    fontSize: 12,
    color: '#AAAAAA',
    marginLeft: 4,
  },
  replyToContainer: {
    flexDirection: 'row',
    backgroundColor: '#2A2A2A',
    borderRadius: 8,
    padding: 8,
    marginBottom: 8,
  },
  replyToBar: {
    width: 3,
    borderRadius: 1.5,
    marginRight: 8,
  },
  replyToContent: {
    flex: 1,
  },
  replyToAuthor: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  replyToText: {
    fontSize: 12,
    color: '#AAAAAA',
  },
});

export default ThreadComment; 